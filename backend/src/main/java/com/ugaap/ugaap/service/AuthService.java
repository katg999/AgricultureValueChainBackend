package com.ugaap.ugaap.service;



import com.ugaap.ugaap.Entity.AuditLog;
import com.ugaap.ugaap.Entity.Client;
import com.ugaap.ugaap.Entity.Session;
import com.ugaap.ugaap.Exception.AccountLockedException;
import com.ugaap.ugaap.Exception.AuthException;
import com.ugaap.ugaap.Repository.AuditLogRepository;
import com.ugaap.ugaap.Repository.ClientRepository;
import com.ugaap.ugaap.Repository.SessionRepository;
import com.ugaap.ugaap.config.AppProperties;
import com.ugaap.ugaap.dto.*;
import com.ugaap.ugaap.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int    MAX_FAILED_ATTEMPTS   = 5;
    private static final long   LOCK_DURATION_MINUTES = 30;
    private static final String REDIS_SESSION_PREFIX  = "session:";
    private static final String REDIS_BLACKLIST_PREFIX = "blacklist:";

    private final ClientRepository clientRepository;
    private final SessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final JwtUtil              jwtUtil;
    private final AppProperties        appProperties;
    private final PasswordEncoder      passwordEncoder;
    private final StringRedisTemplate  redisTemplate;



    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip        = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        Client client = clientRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    saveAuditLog(null, request.getEmail(),
                            AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                            false, "Account not found");
                    return new AuthException("Invalid email or password");
                });

        // check lock
        if (client.isLocked()) {
            saveAuditLog(client.getId(), client.getEmail(),
                    AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Account locked");
            throw new AccountLockedException(
                    "Account locked until " + client.getLockedUntil());
        }

        // check active status
        if (!client.isActive()) {
            saveAuditLog(client.getId(), client.getEmail(),
                    AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Account not active: " + client.getStatus());
            throw new AuthException("Account is " + client.getStatus());
        }

         //verify password
        if (!passwordEncoder.matches(request.getPassword(), client.getPasswordHash())) {
            handleFailedAttempt(client, ip, userAgent);
            throw new AuthException("Invalid email or password");
        }



        // reset failed attempts on success
        client.setFailedLoginAttempts(0);
        client.setLockedUntil(null);
        client.setLastLoginAt(LocalDateTime.now());
        clientRepository.save(client);

        // generate tokens
        String accessToken  = jwtUtil.generateAccessToken(
                client.getId(), client.getEmail(), client.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(client.getId());

        // persist session in DB
        Session session = Session.builder()
                .client(client)
                .refreshToken(refreshToken)
                .ipAddress(ip)
                .userAgent(userAgent)
                .status(Session.SessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now()
                        .plusSeconds(appProperties.getRefreshTokenExpiryMs() / 1000))
                .build();
        sessionRepository.save(session);

        // store refresh token in Redis for fast lookup
        redisTemplate.opsForValue().set(
                REDIS_SESSION_PREFIX + client.getId().toString(),
                refreshToken,
                appProperties.getRefreshTokenExpiryMs(),
                TimeUnit.MILLISECONDS
        );

        // audit
        saveAuditLog(client.getId(), client.getEmail(),
                AuditLog.EventType.LOGIN, ip, userAgent, true, null);

        log.info("Client logged in: {}", client.getEmail());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(appProperties.getAccessTokenExpiryMs())
                .tokenType("Bearer")
                .clientId(client.getId().toString())
                .email(client.getEmail())
                .role(client.getRole().name())
                .build();
    }

    // ── Logout ────────────────────────────────────────────────

    @Transactional
    public void logout(String accessToken, HttpServletRequest httpRequest) {
        String clientId  = jwtUtil.extractClientId(accessToken);
        String ip        = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // blacklist the access token in Redis until it naturally expires
        long ttl = jwtUtil.extractExpiration(accessToken).getTime()
                - System.currentTimeMillis();
        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                    REDIS_BLACKLIST_PREFIX + accessToken,
                    "revoked",
                    ttl,
                    TimeUnit.MILLISECONDS
            );
        }

        // revoke refresh token from Redis
        redisTemplate.delete(REDIS_SESSION_PREFIX + clientId);

        // mark session revoked in DB
        sessionRepository
                .findByRefreshToken(getRefreshTokenForClient(clientId))
                .ifPresent(s -> s.revoke("USER_LOGOUT"));

        // audit
        Client client = clientRepository.findById(UUID.fromString(clientId))
                .orElse(null);
        saveAuditLog(
                client != null ? client.getId() : null,
                client != null ? client.getEmail() : null,
                AuditLog.EventType.LOGOUT, ip, userAgent, true, null
        );

        log.info("Client logged out: {}", clientId);
    }

    // ── Refresh ───────────────────────────────────────────────

    @Transactional
    public LoginResponse refresh(RefreshRequest request,
                                 HttpServletRequest httpRequest) {
        String refreshToken = request.getRefreshToken();
        String ip           = extractIp(httpRequest);
        String userAgent    = httpRequest.getHeader("User-Agent");

        // validate token structure
        if (!jwtUtil.isValid(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw new AuthException("Invalid refresh token");
        }

        String clientId = jwtUtil.extractClientId(refreshToken);

        // validate against Redis (ensures it hasn't been revoked)
        String storedToken = redisTemplate.opsForValue()
                .get(REDIS_SESSION_PREFIX + clientId);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new AuthException("Refresh token not recognised or expired");
        }

        Client client = clientRepository.findById(UUID.fromString(clientId))
                .orElseThrow(() -> new AuthException("Client not found"));

        if (!client.isActive()) {
            throw new AuthException("Account is " + client.getStatus());
        }

        // issue new access token — refresh token stays the same
        String newAccessToken = jwtUtil.generateAccessToken(
                client.getId(), client.getEmail(), client.getRole().name());

        // audit
        saveAuditLog(client.getId(), client.getEmail(),
                AuditLog.EventType.TOKEN_REFRESHED, ip, userAgent, true, null);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)       // unchanged
                .accessTokenExpiresIn(appProperties.getAccessTokenExpiryMs())
                .tokenType("Bearer")
                .clientId(client.getId().toString())
                .email(client.getEmail())
                .role(client.getRole().name())
                .build();
    }




    @Transactional
    public RegisterResponse register(RegisterRequest request,
                                     HttpServletRequest httpRequest) {
        String ip        = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // check if email already taken
        if (clientRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AuthException("Email already registered");
        }

        // hash the password — this is the ONLY place we ever store a password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        Client client = Client.builder()
                .email(request.getEmail())
                .passwordHash(hashedPassword)          // hashed, never plaintext
                .companyName(request.getCompanyName()) 
                .phoneNumber(request.getPhoneNumber())
                .role(Client.ClientRole.CLIENT)              // default role
                .status(Client.ClientStatus.ACTIVE)          // adjust if you want email verification later
                .failedLoginAttempts(0)
                .build();

        clientRepository.save(client);

        // audit
        saveAuditLog(client.getId(), client.getEmail(),
                AuditLog.EventType.REGISTRATION, ip, userAgent, true, null);

        log.info("New client registered: {}", client.getEmail());

        return RegisterResponse.builder()
                .clientId(client.getId().toString())
                .email(client.getEmail())
                .companyName(client.getCompanyName())
                .role(client.getRole().name())
                .status(client.getStatus().name())
                .createdAt(client.getCreatedAt() != null
                        ? client.getCreatedAt().toString() : null)
                .build();
    }

    // ── Profile ───────────────────────────────────────────────

    public ClientProfileResponse getProfile(String clientId) {
        Client client = clientRepository.findById(UUID.fromString(clientId))
                .orElseThrow(() -> new AuthException("Client not found"));

        return ClientProfileResponse.builder()
                .clientId(client.getId().toString())
                .email(client.getEmail())
                .companyName(client.getCompanyName())
                .role(client.getRole().name())
                .status(client.getStatus().name())
                .lastLoginAt(client.getLastLoginAt() != null
                        ? client.getLastLoginAt().toString() : null)
                .build();
    }

    // ── Token blacklist check ─────────────────────────────────

    public boolean isTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(REDIS_BLACKLIST_PREFIX + token));
    }

    // ── Helpers ───────────────────────────────────────────────

    private void handleFailedAttempt(Client client,
                                     String ip, String userAgent) {
        int attempts = client.getFailedLoginAttempts() + 1;
        client.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            client.setLockedUntil(
                    LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
            client.setFailedLoginAttempts(0);
            log.warn("Account locked after {} attempts: {}",
                    MAX_FAILED_ATTEMPTS, client.getEmail());

            saveAuditLog(client.getId(), client.getEmail(),
                    AuditLog.EventType.ACCOUNT_LOCKED, ip, userAgent,
                    false, "Max failed attempts reached");
        } else {
            saveAuditLog(client.getId(), client.getEmail(),
                    AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Wrong password, attempt " + attempts);
        }

        clientRepository.save(client);
    }

    private String getRefreshTokenForClient(String clientId) {
        String token = redisTemplate.opsForValue()
                .get(REDIS_SESSION_PREFIX + clientId);
        return token != null ? token : "";
    }

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

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isEmpty())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }
}