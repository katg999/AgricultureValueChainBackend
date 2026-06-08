package com.ugaap.shared.security;

import com.ugaap.shared.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String REDIS_BLACKLIST_PREFIX = "blacklist:";  // ← must match AuthService

    private final JwtUtil             jwtUtil;
    private final StringRedisTemplate redisTemplate;  // ← replaces AuthService

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,  // ← use jakarta @NonNull if needed
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);

        // ✅ Direct Redis check — no AuthService needed
        if (Boolean.TRUE.equals(redisTemplate.hasKey(REDIS_BLACKLIST_PREFIX + jwt))) {
            log.warn("Blacklisted token access attempt");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (jwtUtil.isValid(jwt) && jwtUtil.isAccessToken(jwt)) {
                String userEmail = jwtUtil.extractEmail(jwt);
                String clientId  = jwtUtil.extractClientId(jwt);

                if (userEmail != null
                        && SecurityContextHolder.getContext().getAuthentication() == null) {

                    List<String> roles = jwtUtil.extractClaim(jwt, "roles");

                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                            .toList();

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(jwt, null, authorities);

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    request.setAttribute("clientId", clientId);
                }
            }
        } catch (Exception e) {
            log.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }


}