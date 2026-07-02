package com.ugaap.membership.service;

import com.ugaap.membership.Entity.Permission;
import com.ugaap.membership.Entity.Role;
import com.ugaap.membership.Entity.User;
import com.ugaap.membership.dto.AccessManagementDto;
import com.ugaap.membership.repository.RoleRepository;
import com.ugaap.membership.repository.UserRepository;
import com.ugaap.shared.client.AuthServiceClient;
import com.ugaap.shared.Exception.AuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository     userRepository;
    private final RoleRepository     roleRepository;
    private final AuthServiceClient  authServiceClient;

    // ── Token claims (called by InternalUserController) ───────

    public AccessManagementDto.TokenClaimsResponse getTokenClaims(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException(
                        "User not found for userId: " + userId));

        Role role = user.getRole();

        List<String> roles = List.of(role.getName());

        List<String> permissions = role.getPermissions().stream()
                .map(p -> p.getModule().name() + ":" + p.getAction().name())
                .toList();

        return new AccessManagementDto.TokenClaimsResponse(
                user.getUserId().toString(),
                user.getUsername(),
                user.getTenantId(),
                user.getBranchId() != null ? user.getBranchId().toString() : null,
                roles,
                permissions
        );
    }

    // ── Create user ───────────────────────────────────────────

    @Transactional
    public AccessManagementDto.UserResponse createUser(
            AccessManagementDto.CreateUserRequest request,
            String createdBy) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already in use: " + request.getEmail());
        }

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new AuthException(
                        "Role not found: " + request.getRoleId()));

        // Generate userId here — shared between both services
        UUID userId = UUID.randomUUID();

        // Generate username: first word of tenant + global sequence
        String username = generateUsername(request.getTenantId());

        // Generate readable password: Cooperative@Year!XXXX
        String plainPassword = generatePassword(request.getTenantId());

        // 1. Create user profile in MembershipService
        User user = User.builder()
                .userId(userId)
                .username(username)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .tenantId(request.getTenantId())
                .branchId(request.getBranchId())
                .role(role)
                .status(User.UserStatus.ACTIVE)
                .mustChangePassword(true)
                .createdBy(createdBy)
                .build();

        userRepository.save(user);
        log.info("User profile created: userId={}, username={}", userId, username);

        // 2. Provision credentials in AuthService
        // NOTE: wrapped in try/catch — auth-service integration (internal API key)
        // is not fully wired up yet, so failures here must not block user creation.
        // TODO: remove this guard once AuthServiceClient's X-Internal-Key is
        // confirmed working end-to-end between membership-service and auth-service.
        try {
            authServiceClient.provisionCredentials(
                    new AuthServiceClient.CredentialsProvisionRequest(
                            userId.toString(),
                            username,
                            request.getEmail(),
                            plainPassword
                    )
            );
            log.info("Credentials provisioned for userId={}", userId);
        } catch (Exception e) {
            log.warn("Credential provisioning failed for userId={}, username={} — " +
                            "user created without auth credentials (auth-service integration " +
                            "will be wired up in a later step): {}",
                    userId, username, e.getMessage());
        }

        return AccessManagementDto.UserResponse.builder()
                .userId(userId.toString())
                .username(username)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .tenantId(request.getTenantId())
                .branchId(request.getBranchId() != null
                        ? request.getBranchId().toString() : null)
                .roleName(role.getName())
                .status(user.getStatus().name())
                .mustChangePassword(true)
                .temporaryPassword(plainPassword) // only returned once
                .build();
    }

    // ── Get user ──────────────────────────────────────────────

    public AccessManagementDto.UserResponse getUser(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException(
                        "User not found: " + userId));
        return mapToResponse(user, null);
    }

    // ── List users (scoped to tenant) ─────────────────────────

    public List<AccessManagementDto.UserResponse> listUsers(String tenantId) {
        return userRepository.findAllByTenantId(tenantId)
                .stream()
                .map(u -> mapToResponse(u, null))
                .toList();
    }

    // ── Deactivate user ───────────────────────────────────────

    @Transactional
    public void deactivateUser(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException(
                        "User not found: " + userId));

        user.setStatus(User.UserStatus.INACTIVE);
        userRepository.save(user);

        // Revoke credentials in AuthService
        // NOTE: same temporary guard as createUser — see TODO above.
        try {
            authServiceClient.deactivateCredentials(userId);
        } catch (Exception e) {
            log.warn("Credential deactivation failed for userId={} — " +
                            "auth-service integration will be wired up in a later step: {}",
                    userId, e.getMessage());
        }

        log.info("User deactivated: userId={}", userId);
    }

    // ── Helpers ───────────────────────────────────────────────

    private String generateUsername(String tenantId) {
        // e.g. tenantId = "umoja-farmers" → prefix = "UMOJA"
        String prefix = tenantId.split("-")[0].toUpperCase();
        long count = userRepository.countByTenantId(tenantId) + 1;
        return String.format("%s%05d", prefix, count);
    }

    private String generatePassword(String tenantId) {
        // e.g. Umoja@2026!Xk9m
        String prefix = tenantId.split("-")[0];
        String capitalized = Character.toUpperCase(prefix.charAt(0))
                + prefix.substring(1).toLowerCase();
        int year = java.time.Year.now().getValue();
        String random = randomAlphanumeric(4);
        return capitalized + "@" + year + "!" + random;
    }

    private String randomAlphanumeric(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        java.security.SecureRandom random = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private AccessManagementDto.UserResponse mapToResponse(User user,
                                                           String temporaryPassword) {
        return AccessManagementDto.UserResponse.builder()
                .userId(user.getUserId().toString())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .tenantId(user.getTenantId())
                .branchId(user.getBranchId() != null
                        ? user.getBranchId().toString() : null)
                .roleName(user.getRole().getName())
                .status(user.getStatus().name())
                .mustChangePassword(user.isMustChangePassword())
                .temporaryPassword(temporaryPassword)
                .build();
    }
}
