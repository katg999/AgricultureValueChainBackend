package com.ugaap.ugaap.InventoryService.Config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityContextInterceptor implements HandlerInterceptor {

    private static final String HEADER_COOPERATIVE_ID = "X-Cooperative-Id";
    private static final String HEADER_BRANCH_ID      = "X-Branch-Id";
    private static final String HEADER_USER_ID        = "X-User-Id";
    private static final String HEADER_TENANT_ID      = "X-Tenant-Id";

    private final RequestSecurityContext securityContext;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // X-Cooperative-Id is a UUID (only set when JWT has cooperative_id claim).
        // X-Tenant-Id is the human-readable tenant key (e.g. "demo-coop") — always set.
        // X-Branch-Id and X-User-Id are UUIDs injected from JWT by the gateway.
        // If a UUID header is present but malformed, log and continue with null rather
        // than aborting with 400 — callers control whether null context is acceptable.
        securityContext.setCooperativeId(parseUuidHeader(request, HEADER_COOPERATIVE_ID));
        securityContext.setBranchId(parseUuidHeader(request, HEADER_BRANCH_ID));
        securityContext.setUserId(parseUuidHeader(request, HEADER_USER_ID));
        securityContext.setTenantId(request.getHeader(HEADER_TENANT_ID));
        return true;
    }

    private UUID parseUuidHeader(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isBlank()) return null;
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            log.warn("Non-UUID value in header {} ({}); treating as absent", headerName, value);
            return null;
        }
    }
}
