package com.ugaap.ugaap.shared.security;

import com.ugaap.ugaap.shared.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UgaapSecurityContext {

    private final JwtUtil jwtUtil;

    private String currentRawJwt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof String jwt) {
            return jwt;
        }

        throw new IllegalStateException("No authenticated JWT present in security context");
    }

    public UUID currentUserId() {
        return UUID.fromString(jwtUtil.extractClientId(currentRawJwt()));
    }

    public String currentUsername() {
        return jwtUtil.extractClaim(currentRawJwt(), "username");
    }

    public String currentTenantId() {
        return jwtUtil.extractClaim(currentRawJwt(), "tenant_id");
    }

    public Optional<UUID> currentBranchId() {
        String branchIdStr = jwtUtil.extractClaim(currentRawJwt(), "branch_id");
        if (branchIdStr == null || branchIdStr.isBlank()) return Optional.empty();
        return Optional.of(UUID.fromString(branchIdStr));
    }

    public List<String> currentRoles() {
        List<String> roles = jwtUtil.extractClaim(currentRawJwt(), "roles");
        return roles != null ? roles : List.of();
    }

    public List<String> currentPermissions() {
        List<String> permissions = jwtUtil.extractClaim(
                currentRawJwt(), "permissions");
        return permissions != null ? permissions : List.of();
    }

    public boolean isPlatformAdmin() {
        return currentRoles().contains("PLATFORM_ADMIN");
    }

    public boolean isCooperativeAdmin() {
        return currentRoles().contains("COOPERATIVE_ADMIN");
    }

    public boolean isBranchManager() {
        return currentRoles().contains("BRANCH_MANAGER");
    }

    public boolean isFieldAgent() {
        return currentRoles().contains("FIELD_AGENT");
    }

    public boolean hasCrossBranchAccess() {
        return isPlatformAdmin() || isCooperativeAdmin();
    }
}