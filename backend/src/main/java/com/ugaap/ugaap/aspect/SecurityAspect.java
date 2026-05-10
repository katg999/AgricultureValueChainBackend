package com.ugaap.ugaap.aspect;

import com.ugaap.ugaap.annotation.RequiresPermission;
import com.ugaap.ugaap.domain.Client;
import com.ugaap.ugaap.exception.AuthException;
import com.ugaap.ugaap.repository.ClientRepository;
import com.ugaap.ugaap.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.UUID;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class SecurityAspect {

    private final ClientRepository clientRepository;

    /**
     * Intercepts methods annotated with @RequiresPermission to enforce
     * both RBAC (Roles) and Multi-Tenancy (Data Isolation).
     */
    @Before("@annotation(requiresPermission)")
    public void validateAccess(RequiresPermission requiresPermission) {
        // 1. Retrieve Authentication from SecurityContext
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException("User is not authenticated");
        }

        // 2. Extract User Details
        // This object should hold the user's Cooperative ID and Role
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        assert userDetails != null;
        UUID userCoopId = userDetails.getCooperativeId();
        String role = userDetails.getRole();

        // 2. Permission Check (RBAC)
        String requiredStr = requiresPermission.module().toUpperCase() + "_" + requiresPermission.action().toUpperCase();
        boolean hasPerm = auth.getAuthorities().stream()
                .anyMatch(a -> Objects.equals(a.getAuthority(), requiredStr));

        boolean hasPermission = auth.getAuthorities().stream()
                .anyMatch(a -> Objects.equals(a.getAuthority(), requiredPermission));

        if (!hasPermission) {
            throw new AuthException("Access Denied: Missing permission [" + requiredPermission + "]");
        }

        // 3. Multi-Tenant Verify (Tenant must exist for non-platform admins)
        if (userCoopId == null && !role.equals("PLATFORM_ADMIN")) {
            throw new AuthException("Access Denied: User not linked to a Cooperative.");
        }

        // 4. DATA ISOLATION (Resource Ownership Verification)
        // We scan method arguments for a UUID (likely a Farmer/Client ID)
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg instanceof UUID resourceId) {
                // Fetch the target resource (e.g., the Farmer)
                Client targetResource = clientRepository.findById(resourceId).orElse(null);

                if (targetResource != null && targetResource.getCooperative() != null) {
                    UUID resourceCoopId = targetResource.getCooperative().getId();

                    // Logic: If I am not a Platform Admin, I can ONLY touch data from my Coop
                    if (!role.equals("PLATFORM_ADMIN") && !userCoopId.equals(resourceCoopId)) {
                        log.error("SECURITY BREACH: User {} from Coop {} tried to access Resource {} from Coop {}",
                                userDetails.getUsername(), userCoopId, resourceId, resourceCoopId);
                        throw new AuthException("Access Denied: You do not own this resource.");
                    }
                }
            }
        }

        log.info("Access Granted: User {} cleared for {}", userDetails.getUsername(), requiredStr);
    }
}