package com.ugaap.api_gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Runs on every request before routing.
 * If a valid Bearer token is present, extracts userId, cooperativeId (tenant_id),
 * and branchId from JWT claims and forwards them as X-User-Id, X-Cooperative-Id,
 * X-Branch-Id headers so downstream services don't need to touch the JWT.
 */
@Slf4j
@Component
public class JwtHeaderPropagationFilter implements GlobalFilter, Ordered {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);

        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId        = claims.getSubject();
            String cooperativeId = claims.get("tenant_id", String.class);
            String branchId      = claims.get("branch_id", String.class);

            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .headers(headers -> {
                        if (userId != null && !userId.isBlank())
                            headers.set("X-User-Id", userId);
                        if (cooperativeId != null && !cooperativeId.isBlank())
                            headers.set("X-Cooperative-Id", cooperativeId);
                        if (branchId != null && !branchId.isBlank())
                            headers.set("X-Branch-Id", branchId);
                    })
                    .build();

            log.debug("JWT propagated — userId={} cooperativeId={} branchId={}",
                    userId, cooperativeId, branchId);

            return chain.filter(exchange.mutate().request(mutated).build());

        } catch (Exception e) {
            log.warn("JWT header propagation skipped: {}", e.getMessage());
            return chain.filter(exchange);
        }
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
