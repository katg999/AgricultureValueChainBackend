package com.ugaap.ugaap.shared.security;

import com.ugaap.ugaap.AuthenticationService.service.AuthService;
import com.ugaap.ugaap.shared.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        final String clientId;

        // 1. Skip if no Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        // 2. Critical Security Check: Is this token blacklisted in Redis?
        if (authService.isTokenBlacklisted(jwt)) {
            log.warn("Blacklisted token access attempt: {}", jwt);
            filterChain.doFilter(request, response); // Will result in 403/401 by SecurityConfig
            return;
        }

        try {
            if (jwtUtil.isValid(jwt) && jwtUtil.isAccessToken(jwt)) {
               userEmail = jwtUtil.extractEmail(jwt);
                String userId = jwtUtil.extractClientId(jwt);

                clientId = jwtUtil.extractClientId(jwt);

                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    List<String> roles = jwtUtil.extractClaim(jwt, "roles");

                    List<SimpleGrantedAuthority> authorities =
                            roles.stream()
                                    .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                                    .toList();

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            jwt,
                            null,
                            authorities
                    );

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 3. Set the security context
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // Add clientId to request attributes so controllers can use it easily
                    request.setAttribute("clientId", clientId);
                }
            }
        } catch (Exception e) {
            log.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }
}