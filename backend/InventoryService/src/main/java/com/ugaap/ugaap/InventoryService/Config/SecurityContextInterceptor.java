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

    private final RequestSecurityContext securityContext;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        UUID cooperativeId = parseHeader(request, response, HEADER_COOPERATIVE_ID);
        if (cooperativeId == null && headerPresent(request, HEADER_COOPERATIVE_ID)) return false;

        UUID branchId = parseHeader(request, response, HEADER_BRANCH_ID);
        if (branchId == null && headerPresent(request, HEADER_BRANCH_ID)) return false;

        UUID userId = parseHeader(request, response, HEADER_USER_ID);
        if (userId == null && headerPresent(request, HEADER_USER_ID)) return false;

        securityContext.setCooperativeId(cooperativeId);
        securityContext.setBranchId(branchId);
        securityContext.setUserId(userId);

        return true;
    }

    private UUID parseHeader(HttpServletRequest request, HttpServletResponse response, String headerName) throws Exception {
        String value = request.getHeader(headerName);
        if (value == null || value.isBlank()) return null;

        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            log.warn("Malformed UUID in header {}: {}", headerName, value);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid UUID in header: " + headerName);
            return null;
        }
    }

    private boolean headerPresent(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        return value != null && !value.isBlank();
    }
}
