package com.ugaap.shared.util;




import com.ugaap.shared.config.AppProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final AppProperties appProperties;



    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                appProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8)
        );
    }



    /**
     * Generates a short-lived access token (15 min).
     * Claims carry clientId, email, and role — enough
     * for downstream services to authorise without a DB call.
     */
    public String generateAccessToken(
            UUID clientId,
            String email,
            String username,
            String tenantId,
            String branchId,
            List<String> roles,
            List<String> permissions   // add this
    ) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .subject(clientId.toString())
                .issuedAt(new Date(now))
                .expiration(new Date(now + appProperties.getJwt().getAccessTokenExpiryMs()))
                .claims(Map.of(
                        "email", email,
                        "username", username,
                        "tenant_id", tenantId,
                        "branch_id", branchId,
                        "roles", roles,
                        "permissions", permissions,  // add this
                        "type", "ACCESS"
                ))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generates a long-lived refresh token (7 days).
     * Stored in Redis and DB so it can be revoked.
     */
    public String generateRefreshToken(UUID clientId) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .subject(clientId.toString())
                .id(UUID.randomUUID().toString())   // unique jti per token
                .issuedAt(new Date(now))
                .expiration(new Date(now + appProperties.getJwt().getRefreshTokenExpiryMs()))
                .claims(Map.of("type", "REFRESH"))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Validation ────────────────────────────────────────────

    /**
     * Validates the token signature and expiry.
     * Returns true only if the token is well-formed and not expired.
     */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("JWT unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("JWT malformed: {}", e.getMessage());
        } catch (SecurityException e) {
            log.warn("JWT signature invalid: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims empty: {}", e.getMessage());
        }
        return false;
    }

    public boolean isAccessToken(String token) {
        return "ACCESS".equals(extractClaim(token, "type"));
    }

    public boolean isRefreshToken(String token) {
        return "REFRESH".equals(extractClaim(token, "type"));
    }

    public boolean isExpired(String token) {
        try {
            return parseClaims(token)
                    .getExpiration()
                    .before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    // ── Claim extraction ──────────────────────────────────────

    public String extractClientId(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractEmail(String token) {
        return extractClaim(token, "email");
    }

    public String extractRole(String token) {
        return extractClaim(token, "role");
    }

    public Date extractExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    public String extractTokenId(String token) {
        return parseClaims(token).getId();   // jti claim
    }

    @SuppressWarnings("unchecked")
    public <T> T extractClaim(String token, String claimKey) {
        return (T) parseClaims(token).get(claimKey);
    }

    // ── Internal ──────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }


}