package com.ugaap.ugaap.service;

import com.ugaap.ugaap.Entity.AuditLog;
import com.ugaap.ugaap.Entity.Client;
import com.ugaap.ugaap.Entity.PasswordResetToken;
import com.ugaap.ugaap.Repository.AuditLogRepository;
import com.ugaap.ugaap.Repository.ClientRepository;
import com.ugaap.ugaap.Repository.PasswordResetTokenRepository;
import com.ugaap.ugaap.dto.CompletePasswordResetRequest;
import com.ugaap.ugaap.dto.PasswordResetRequest;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Handles password reset for Client accounts.
 *
 * Security rules:
 * - The API never confirms whether an email exists.
 * - Reset codes are generated with SecureRandom.
 * - Reset codes are stored only as BCrypt hashes.
 * - New passwords are stored only as BCrypt hashes.
 * - Reset records expire quickly.
 * - Reset records lock after too many failed attempts.
 * - Redis rate limits repeated reset requests.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int TOKEN_EXPIRY_MINUTES = 5;
    private static final int MAX_VERIFICATION_ATTEMPTS = 3;
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 128;
    private static final int MAX_RESET_REQUESTS_PER_HOUR = 3;
    private static final String REDIS_RESET_RATE_PREFIX = "password-reset-request:";

    private final ClientRepository clientRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordResetCodeSender resetCodeSender;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Starts password reset.
     *
     * The controller always returns a generic success message so attackers
     * cannot discover which emails are registered.
     */
    @Transactional
    public void requestPasswordReset(PasswordResetRequest request, HttpServletRequest httpRequest) {
        String email = normalizeEmail(request.getEmail());
        String ip = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        if (isRateLimited(email, ip)) {
            saveAuditLog(null, email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset request rate limited");
            return;
        }

        Optional<Client> clientOptional = clientRepository.findByEmail(email);

        if (clientOptional.isEmpty()) {
            saveAuditLog(null, email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset requested for unknown email");
            return;
        }

        Client client = clientOptional.get();

        if (!client.isActive()) {
            saveAuditLog(client.getId(), email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset requested for inactive account");
            return;
        }

        String resetId = UUID.randomUUID().toString();
        String plainCode = generateSixDigitCode();

        PasswordResetToken token = PasswordResetToken.builder()
                .resetId(resetId)
                .email(email)
                .codeHash(passwordEncoder.encode(plainCode))
                .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES))
                .verificationAttempts(0)
                .status(PasswordResetToken.PasswordResetStatus.ACTIVE)
                .build();

        resetTokenRepository.save(token);
        resetCodeSender.sendPasswordResetCode(email, resetId, plainCode);

        saveAuditLog(client.getId(), email, AuditLog.EventType.PASSWORD_CHANGED, ip, userAgent,
                true, "Password reset code issued");
    }

    /**
     * Completes password reset after the client submits resetId, email, code,
     * and a new password.
     */
    @Transactional
    public boolean completePasswordReset(CompletePasswordResetRequest request, HttpServletRequest httpRequest) {
        String email = normalizeEmail(request.getEmail());
        String ip = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        Optional<PasswordResetToken> tokenOptional =
                resetTokenRepository.findByResetId(request.getResetId());

        if (tokenOptional.isEmpty()) {
            saveAuditLog(null, email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset failed: unknown reset id");
            return false;
        }

        PasswordResetToken token = tokenOptional.get();

        if (!canTokenStillBeUsed(token)) {
            resetTokenRepository.save(token);
            saveAuditLog(null, email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset failed: token unusable");
            return false;
        }

        if (!token.getEmail().equals(email)) {
            recordFailedAttempt(token);
            saveAuditLog(null, email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset failed: email mismatch");
            return false;
        }

        if (!passwordEncoder.matches(request.getCode(), token.getCodeHash())) {
            recordFailedAttempt(token);
            saveAuditLog(null, email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset failed: wrong code");
            return false;
        }

        if (!isPasswordValid(request.getNewPassword())) {
            saveAuditLog(null, email, AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Password reset failed: weak password");
            return false;
        }

        Optional<Client> clientOptional = clientRepository.findByEmail(email);

        if (clientOptional.isEmpty()) {
            token.setStatus(PasswordResetToken.PasswordResetStatus.USED);
            resetTokenRepository.save(token);
            return false;
        }

        Client client = clientOptional.get();

        /*
         * Critical production rule:
         * Only the password hash is saved. The plain password is never stored.
         */
        client.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        client.setFailedLoginAttempts(0);
        client.setLockedUntil(null);
        clientRepository.save(client);

        /*
         * Critical production rule:
         * A reset code is single-use.
         */
        token.setStatus(PasswordResetToken.PasswordResetStatus.USED);
        resetTokenRepository.save(token);

        saveAuditLog(client.getId(), email, AuditLog.EventType.PASSWORD_CHANGED, ip, userAgent,
                true, "Password reset completed");

        log.info("Password reset completed for client {}", email);
        return true;
    }

    /** Deletes expired password reset records. */
    @Transactional
    public long cleanupExpiredResetTokens() {
        return resetTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    /** Checks token status, expiry, and failed-attempt count. */
    private boolean canTokenStillBeUsed(PasswordResetToken token) {
        if (!token.isActive()) {
            return false;
        }

        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            token.setStatus(PasswordResetToken.PasswordResetStatus.EXPIRED);
            return false;
        }

        if (token.getVerificationAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
            token.setStatus(PasswordResetToken.PasswordResetStatus.LOCKED);
            return false;
        }

        return true;
    }

    /** Increments failed verification attempts and locks the token when needed. */
    private void recordFailedAttempt(PasswordResetToken token) {
        token.setVerificationAttempts(token.getVerificationAttempts() + 1);

        if (token.getVerificationAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
            token.setStatus(PasswordResetToken.PasswordResetStatus.LOCKED);
        }

        resetTokenRepository.save(token);
    }

    /** Uses Redis to slow repeated password reset requests by email and IP. */
    private boolean isRateLimited(String email, String ip) {
        return incrementAndCheckLimit(REDIS_RESET_RATE_PREFIX + "email:" + email)
                || incrementAndCheckLimit(REDIS_RESET_RATE_PREFIX + "ip:" + ip);
    }

    /** Increments a Redis counter and expires it after one hour. */
    private boolean incrementAndCheckLimit(String key) {
        Long count = redisTemplate.opsForValue().increment(key);

        if (count != null && count == 1L) {
            redisTemplate.expire(key, 1, TimeUnit.HOURS);
        }

        return count != null && count > MAX_RESET_REQUESTS_PER_HOUR;
    }

    /** Applies the password policy for reset passwords. */
    private boolean isPasswordValid(String password) {
        if (password == null) {
            return false;
        }

        if (password.length() < MIN_PASSWORD_LENGTH || password.length() > MAX_PASSWORD_LENGTH) {
            return false;
        }

        boolean hasUpper = password.matches(".*[A-Z].*");
        boolean hasLower = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[^A-Za-z0-9].*");

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    /** Generates a secure zero-padded 6-digit reset code. */
    private String generateSixDigitCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    /** Normalizes email before database lookups. */
    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Extracts client IP, respecting reverse-proxy headers. */
    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isEmpty())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }

    /** Stores audit information for security monitoring. */
    private void saveAuditLog(UUID clientId, String email,
                              AuditLog.EventType eventType,
                              String ip, String userAgent,
                              boolean success, String failureReason) {
        auditLogRepository.save(AuditLog.builder()
                .clientId(clientId)
                .email(email)
                .eventType(eventType)
                .ipAddress(ip)
                .userAgent(userAgent)
                .success(success)
                .failureReason(failureReason)
                .build());
    }
}
