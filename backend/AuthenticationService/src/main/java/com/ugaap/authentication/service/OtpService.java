package com.ugaap.authentication.service;

import com.ugaap.shared.Exception.AuthException;
import com.ugaap.authentication.Repository.CredentialsRepository;
import com.ugaap.authentication.Entity.Credentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_PREFIX       = "pwd_otp:";
    private static final String VERIFIED_PREFIX  = "pwd_verified:";
    private static final int    OTP_EXPIRY_MINUTES      = 5;
    private static final int    VERIFIED_EXPIRY_MINUTES = 10;

    private final StringRedisTemplate  redisTemplate;
    private final CredentialsRepository credentialsRepository;
    private final PasswordEncoder      passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom         secureRandom = new SecureRandom();

    // ── Step 1: Forgot Password → generate OTP → send to email ───────────────

    public void generateAndSendOtp(String email) {

        Credentials credentials = credentialsRepository
                .findByEmail(email)
                .orElseThrow(() -> new AuthException(
                        "No account found with that email"));

        String otp = String.format("%04d", secureRandom.nextInt(10000));

        redisTemplate.opsForValue().set(
                OTP_PREFIX + email,
                otp,
                OTP_EXPIRY_MINUTES,
                TimeUnit.MINUTES
        );

        // TODO: emailService.sendOtp(email, otp);
        try {
            emailService.sendOtp(email, otp);
        } catch (IOException e) {
            log.error("Failed to send password reset OTP to {}: {}", email, e.getMessage());
            throw new AuthException("Failed to send OTP email. Please try again.");
        }
    }

    // ── Step 2: Verify OTP only → return a short-lived verified token ─────────

    public String verifyOtp(String email, String otp) {

        // confirm account exists
        credentialsRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Account not found"));

        String storedOtp = redisTemplate.opsForValue()
                .get(OTP_PREFIX + email);

        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new AuthException("Invalid or expired OTP");
        }

        // Delete OTP — one time use
        redisTemplate.delete(OTP_PREFIX + email);

        // Issue short-lived verifiedToken
        String verifiedToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                VERIFIED_PREFIX + verifiedToken,
                email,
                VERIFIED_EXPIRY_MINUTES,
                TimeUnit.MINUTES
        );

        log.info("Password reset OTP verified for {}", email);
        return verifiedToken;
    }

    // ── Step 3: Set new password using verifiedToken ──────────────────────────

    public void resetPassword(String verifiedToken, String newPassword) {

        // Look up email from the verified token
        String email = redisTemplate.opsForValue()
                .get(VERIFIED_PREFIX + verifiedToken);

        if (email == null) {
            throw new AuthException(
                    "Session expired or invalid. Please restart the password reset flow.");
        }

        Credentials credentials = credentialsRepository
                .findByEmail(email)
                .orElseThrow(() -> new AuthException("Account not found"));

        // Validate password strength
        if (!isStrongPassword(newPassword)) {
            throw new AuthException(
                    "Password must be at least 8 characters and include " +
                            "an uppercase letter, a number, and a special character");
        }

        credentials.setPasswordHash(passwordEncoder.encode(newPassword));
        credentials.setMustChangePassword(false);
        credentialsRepository.save(credentials);

        // Clean up verified token
        redisTemplate.delete(VERIFIED_PREFIX + verifiedToken);

        log.info("Password successfully reset for {}", email);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasUpper   = password.chars().anyMatch(Character::isUpperCase);
        boolean hasDigit   = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(c ->
                "!@#$%^&*()_+-=[]{}|;':\",./<>?".indexOf(c) >= 0);
        return hasUpper && hasDigit && hasSpecial;
    }
}