package com.ugaap.authentication.service;

import com.ugaap.authentication.Entity.AuditLog;
import com.ugaap.authentication.Entity.Credentials;
import com.ugaap.authentication.Entity.Session;
import com.ugaap.authentication.Repository.AuditLogRepository;
import com.ugaap.authentication.Repository.CredentialsRepository;
import com.ugaap.authentication.Repository.SessionRepository;
import com.ugaap.authentication.dto.*;
import com.ugaap.shared.client.MembershipServiceClient;
import com.ugaap.shared.config.AppProperties;
import com.ugaap.shared.Exception.AccountLockedException;
import com.ugaap.shared.Exception.AuthException;
import com.ugaap.shared.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class    AuthService {

    private static final int    MAX_FAILED_ATTEMPTS    = 5;
    private static final long   LOCK_DURATION_MINUTES  = 30;
    private static final String REDIS_SESSION_PREFIX   = "session:";
    private static final String REDIS_BLACKLIST_PREFIX = "blacklist:";
    private static final long   CLOCK_DRIFT_BUFFER_MS  = 60_000;

    private final CredentialsRepository  credentialsRepository;
    private final SessionRepository      sessionRepository;
    private final AuditLogRepository     auditLogRepository;
    private final JwtUtil                jwtUtil;
    private final AppProperties          appProperties;
    private final PasswordEncoder        passwordEncoder;
    private final StringRedisTemplate    redisTemplate;
    private final MembershipServiceClient membershipServiceClient;

// ── Login Step 1: Validate credentials, send OTP, return tempToken ──────

    @Transactional
    public TempTokenResponse loginStep1(LoginRequest request,
                                        HttpServletRequest httpRequest) {
        String ip        = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // 1. Find credentials
        Credentials credentials = credentialsRepository
                .findByUsernameOrEmail(
                        request.getUsernameOrEmail(),
                        request.getUsernameOrEmail())
                .orElseThrow(() -> {
                    saveAuditLog(null, request.getUsernameOrEmail(),
                            AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                            false, "Account not found");
                    return new AuthException("Invalid username/email or password");
                });

        // 2. Check if account is locked
        if (credentials.isLocked()) {
            throw new AccountLockedException(
                    "Account locked until " + credentials.getLockedUntil());
        }

        // 3. Validate password
        if (!passwordEncoder.matches(
                request.getPassword(), credentials.getPasswordHash())) {
            handleFailedAttempt(credentials, ip, userAgent);
            throw new AuthException("Invalid username/email or password");
        }

        // 4. Reset failed attempts on successful password match
        credentials.setFailedLoginAttempts(0);
        credentials.setLockedUntil(null);
        credentials.setLastLoginAt(LocalDateTime.now());
        credentialsRepository.save(credentials);

        // 5. Generate 6-digit OTP
        String otp = String.format("%04d", new SecureRandom().nextInt(10000));

        // 6. Generate tempToken (UUID)
        String tempToken = UUID.randomUUID().toString();

        // 7. Store in Redis: "login_otp:{tempToken}" → "{userId}:{otp}", TTL 5 min
        String payload = credentials.getUserId().toString() + ":" + otp;
        redisTemplate.opsForValue().set(
                "login_otp:" + tempToken,
                payload,
                5,
                TimeUnit.MINUTES
        );

        // 8. Send OTP email
        // TODO: replace with real emailService.send() once wired
        log.info("LOGIN OTP for {} : {}", credentials.getEmail(), otp);

        saveAuditLog(credentials.getUserId(), credentials.getEmail(),
                AuditLog.EventType.LOGIN, ip, userAgent, true,
                "OTP generated, awaiting verification");

        return TempTokenResponse.builder()
                .tempToken(tempToken)
                .message("OTP sent to " + credentials.getEmail())
                .build();
    }


// ── Login Step 2: Verify OTP → issue full tokens ──────────────────────────

    @Transactional
    public LoginResponse loginStep2(OtpVerifyRequest request,
                                    HttpServletRequest httpRequest) {
        String ip        = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // 1. Look up the Redis payload by tempToken
        String redisKey = "login_otp:" + request.getTempToken();
        String payload  = redisTemplate.opsForValue().get(redisKey);

        if (payload == null) {
            throw new AuthException("OTP expired or invalid session. Please log in again.");
        }

        // 2. Split payload into userId and storedOtp
        String[] parts    = payload.split(":");
        String   userId   = parts[0];
        String   storedOtp = parts[1];

        // 3. Validate OTP
        if (!storedOtp.equals(request.getOtp())) {
            saveAuditLog(UUID.fromString(userId), null,
                    AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Invalid OTP attempt");
            throw new AuthException("Invalid OTP. Please try again.");
        }

        // 4. Delete OTP from Redis — one time use only
        redisTemplate.delete(redisKey);

        // 5. Load credentials
        Credentials credentials = credentialsRepository
                .findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException("User not found"));

        // 6. Fetch claims from MembershipService
        MembershipServiceClient.TokenClaimsResponse claims =
                membershipServiceClient.getTokenClaims(userId);

        // 7. Issue full tokens and persist session
        String accessToken = jwtUtil.generateAccessToken(
                credentials.getUserId(),
                credentials.getEmail(),
                credentials.getUsername(),
                claims.tenantId()  != null ? claims.tenantId()  : "",
                claims.branchId()  != null ? claims.branchId()  : "",
                claims.roles(),
                claims.permissions()
        );

        String refreshToken = jwtUtil.generateRefreshToken(credentials.getUserId());

        Session session = Session.builder()
                .userId(credentials.getUserId())
                .refreshToken(refreshToken)
                .ipAddress(ip)
                .userAgent(userAgent)
                .status(Session.SessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        appProperties.getJwt().getRefreshTokenExpiryMs() / 1000))
                .build();
        sessionRepository.save(session);

        redisTemplate.opsForValue().set(
                REDIS_SESSION_PREFIX + credentials.getUserId(),
                refreshToken,
                appProperties.getJwt().getRefreshTokenExpiryMs(),
                TimeUnit.MILLISECONDS
        );

        saveAuditLog(credentials.getUserId(), credentials.getEmail(),
                AuditLog.EventType.LOGIN, ip, userAgent, true, null);

        log.info("User fully authenticated via OTP: {}", credentials.getUsername());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(appProperties.getJwt().getAccessTokenExpiryMs())
                .tokenType("Bearer")
                .userId(credentials.getUserId().toString())
                .username(credentials.getUsername())
                .email(credentials.getEmail())
                .roles(claims.roles())
                .build();
    }


    // ── Provision (called by InternalCredentialsController) ───

    @Transactional
    public CredentialsResult provisionCredentials(UUID userId,
                                                  String username,
                                                  String email,
                                                  String plainPassword) {
        if (credentialsRepository.existsByEmail(email)) {
            throw new AuthException("Email already registered: " + email);
        }
        if (credentialsRepository.existsByUsername(username)) {
            throw new AuthException("Username already taken: " + username);
        }

        Credentials credentials = Credentials.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(plainPassword))
                .status(Credentials.CredentialStatus.ACTIVE)
                .mustChangePassword(true)
                .failedLoginAttempts(0)
                .build();

        credentialsRepository.save(credentials);

        saveAuditLog(userId, email, AuditLog.EventType.REGISTRATION,
                "system", "internal-provisioning", true, null);

        log.info("Credentials provisioned for userId={}, username={}",
                userId, username);

        return new CredentialsResult(userId, username, email);
    }

    // ── Deactivate ────────────────────────────────────────────

    @Transactional
    public void deactivateCredentials(UUID userId) {
        Credentials credentials = credentialsRepository.findById(userId)
                .orElseThrow(() -> new AuthException(
                        "Credentials not found for userId: " + userId));

        credentials.setStatus(Credentials.CredentialStatus.INACTIVE);
        credentialsRepository.save(credentials);

        // Revoke active sessions
        redisTemplate.delete(REDIS_SESSION_PREFIX + userId);
        log.info("Credentials deactivated for userId={}", userId);
    }

    // ── Logout ────────────────────────────────────────────────

    @Transactional
    public void logout(String accessToken, HttpServletRequest httpRequest) {
        String userId    = jwtUtil.extractClientId(accessToken);
        String ip        = extractIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        long ttl = jwtUtil.extractExpiration(accessToken).getTime()
                - System.currentTimeMillis() + CLOCK_DRIFT_BUFFER_MS;
        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                    REDIS_BLACKLIST_PREFIX + accessToken,
                    "revoked", ttl, TimeUnit.MILLISECONDS);
        }

        redisTemplate.delete(REDIS_SESSION_PREFIX + userId);

        sessionRepository.findByRefreshToken(
                        getRefreshTokenForClient(userId))
                .ifPresent(s -> s.revoke("USER_LOGOUT"));

        saveAuditLog(UUID.fromString(userId), null,
                AuditLog.EventType.LOGOUT, ip, userAgent, true, null);

        log.info("User logged out: {}", userId);
    }

    // ── Refresh ───────────────────────────────────────────────

    @Transactional
    public LoginResponse refresh(RefreshRequest request,
                                 HttpServletRequest httpRequest) {
        String oldRefreshToken = request.getRefreshToken();
        String ip           = extractIp(httpRequest);
        String userAgent    = httpRequest.getHeader("User-Agent");

        if (!jwtUtil.isValid(oldRefreshToken)
                || !jwtUtil.isRefreshToken(oldRefreshToken)) {
            throw new AuthException("Invalid refresh token");
        }

        String userId   = jwtUtil.extractClientId(oldRefreshToken);
        String redisKey = REDIS_SESSION_PREFIX + userId;

        String currentValidToken = redisTemplate.opsForValue().get(redisKey);
        if (currentValidToken == null
                || !currentValidToken.equals(oldRefreshToken)) {
            handleTokenReuse(userId, ip, userAgent);
            throw new AuthException(
                    "Token theft detected. All sessions revoked.");
        }

        Credentials credentials = credentialsRepository
                .findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException("User not found"));

        redisTemplate.delete(redisKey);
        sessionRepository.findByRefreshToken(oldRefreshToken)
                .ifPresent(s -> s.revoke("TOKEN_ROTATED"));

        MembershipServiceClient.TokenClaimsResponse claims =
                membershipServiceClient.getTokenClaims(userId);

        return generateFullAuthResponse(credentials, claims, ip, userAgent);
    }

    // ── Token blacklist check ─────────────────────────────────

    public boolean isTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(REDIS_BLACKLIST_PREFIX + token));
    }

    // ── Helpers ───────────────────────────────────────────────

    private LoginResponse generateFullAuthResponse(
            Credentials credentials,
            MembershipServiceClient.TokenClaimsResponse claims,
            String ip, String userAgent) {

        String accessToken = jwtUtil.generateAccessToken(
                credentials.getUserId(),
                credentials.getEmail(),
                credentials.getUsername(),
                claims.tenantId() != null ? claims.tenantId() : "",
                claims.branchId() != null ? claims.branchId() : "",
                claims.roles(),
                claims.permissions()
        );

        String refreshToken = jwtUtil.generateRefreshToken(
                credentials.getUserId());

        Session session = Session.builder()
                .userId(credentials.getUserId())
                .refreshToken(refreshToken)
                .ipAddress(ip)
                .userAgent(userAgent)
                .status(Session.SessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        appProperties.getJwt().getRefreshTokenExpiryMs() / 1000))
                .build();
        sessionRepository.save(session);

        redisTemplate.opsForValue().set(
                REDIS_SESSION_PREFIX + credentials.getUserId(),
                refreshToken,
                appProperties.getJwt().getRefreshTokenExpiryMs(),
                TimeUnit.MILLISECONDS
        );

        saveAuditLog(credentials.getUserId(), credentials.getEmail(),
                AuditLog.EventType.TOKEN_REFRESHED, ip, userAgent, true, null);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresIn(
                        appProperties.getJwt().getAccessTokenExpiryMs())
                .tokenType("Bearer")
                .userId(credentials.getUserId().toString())
                .username(credentials.getUsername())
                .email(credentials.getEmail())
                .roles(claims.roles())
                .build();
    }

    private void handleFailedAttempt(Credentials credentials,
                                     String ip, String userAgent) {
        int attempts = credentials.getFailedLoginAttempts() + 1;
        credentials.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            credentials.setLockedUntil(
                    LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
            credentials.setFailedLoginAttempts(0);
            saveAuditLog(credentials.getUserId(), credentials.getEmail(),
                    AuditLog.EventType.ACCOUNT_LOCKED, ip, userAgent,
                    false, "Max failed attempts reached");
        } else {
            saveAuditLog(credentials.getUserId(), credentials.getEmail(),
                    AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                    false, "Wrong password, attempt " + attempts);
        }
        credentialsRepository.save(credentials);
    }

    private void handleTokenReuse(String userId, String ip, String userAgent) {
        log.error("Refresh token reuse detected for userId={}", userId);
        redisTemplate.delete(REDIS_SESSION_PREFIX + userId);
        saveAuditLog(UUID.fromString(userId), null,
                AuditLog.EventType.LOGIN_FAILED, ip, userAgent,
                false, "Refresh token reuse detected");
    }

    private String getRefreshTokenForClient(String userId) {
        String token = redisTemplate.opsForValue()
                .get(REDIS_SESSION_PREFIX + userId);
        return token != null ? token : "";
    }

    private void saveAuditLog(UUID userId, String email,
                              AuditLog.EventType eventType,
                              String ip, String userAgent,
                              boolean success, String failureReason) {
        auditLogRepository.save(AuditLog.builder()
                .action(eventType.name())        // NOT NULL
                .entityId(userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .entityType("USER")              // NOT NULL
                .performedAt(LocalDateTime.now()) // NOT NULL
                .performedBy(userId != null ? userId : UUID.fromString("00000000-0000-0000-0000-000000000000"))
                .eventType(eventType)            // NOT NULL
                .success(success)                // NOT NULL
                .clientId(userId)
                .email(email)
                .ipAddress(ip)
                .userAgent(userAgent)
                .failureReason(failureReason)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isEmpty())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }

    public record CredentialsResult(UUID userId, String username, String email) {}




}