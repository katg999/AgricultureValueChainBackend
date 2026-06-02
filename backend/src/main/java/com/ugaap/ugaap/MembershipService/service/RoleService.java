package com.ugaap.ugaap.MembershipService.service;

import com.ugaap.ugaap.MembershipService.Entity.Permission;
import com.ugaap.ugaap.MembershipService.Entity.Role;
import com.ugaap.ugaap.MembershipService.dto.AccessManagementDto;
import com.ugaap.ugaap.MembershipService.repository.PermissionRepository;
import com.ugaap.ugaap.MembershipService.repository.RoleRepository;
import com.ugaap.ugaap.shared.Exception.AuthException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository       roleRepository;
    private final PermissionRepository permissionRepository;

    // ── Create role ───────────────────────────────────────────

    @Transactional
    public AccessManagementDto.RoleResponse createRole(
            AccessManagementDto.CreateRoleRequest request,
            String createdBy) {

        if (roleRepository.existsByNameAndTenantId(
                request.getName(), request.getTenantId())) {
            throw new AuthException(
                    "Role '" + request.getName()
                            + "' already exists for this tenant");
        }

        Role role = Role.builder()
                .tenantId(request.getTenantId())
                .name(request.getName())
                .description(request.getDescription())
                .permissions(new HashSet<>())
                .build();

        roleRepository.save(role);
        log.info("Role created: name={}, tenantId={}",
                request.getName(), request.getTenantId());

        return mapToResponse(role);
    }

    // ── List roles (scoped to tenant) ─────────────────────────

    public List<AccessManagementDto.RoleResponse> listRoles(String tenantId) {
        return roleRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Assign permissions to role ────────────────────────────

    @Transactional
    public AccessManagementDto.RoleResponse assignPermissions(
            String roleId,
            AccessManagementDto.AssignPermissionsRequest request) {

        Role role = roleRepository.findById(UUID.fromString(roleId))
                .orElseThrow(() -> new AuthException(
                        "Role not found: " + roleId));

        Set<Permission> permissions = new HashSet<>();
        for (AccessManagementDto.PermissionRequest pr : request.getPermissions()) {
            Permission permission = permissionRepository
                    .findByModuleAndAction(
                            Permission.Module.valueOf(pr.getModule()),
                            Permission.Action.valueOf(pr.getAction()))
                    .orElseGet(() -> permissionRepository.save(
                            Permission.builder()
                                    .module(Permission.Module.valueOf(pr.getModule()))
                                    .action(Permission.Action.valueOf(pr.getAction()))
                                    .description(pr.getDescription())
                                    .build()
                    ));
            permissions.add(permission);
        }

        role.setPermissions(permissions);
        roleRepository.save(role);

        log.info("Permissions assigned to roleId={}, count={}",
                roleId, permissions.size());

        return mapToResponse(role);
    }

    // ── Delete role ───────────────────────────────────────────

    @Transactional
    public void deleteRole(String roleId) {
        Role role = roleRepository.findById(UUID.fromString(roleId))
                .orElseThrow(() -> new AuthException(
                        "Role not found: " + roleId));
        roleRepository.delete(role);
        log.info("Role deleted: roleId={}", roleId);
    }

    // ── Helper ────────────────────────────────────────────────

    private AccessManagementDto.RoleResponse mapToResponse(Role role) {
        List<AccessManagementDto.PermissionResponse> permissions =
                role.getPermissions().stream()
                        .map(p -> AccessManagementDto.PermissionResponse.builder()
                                .permissionId(p.getPermissionId().toString())
                                .module(p.getModule().name())
                                .action(p.getAction().name())
                                .description(p.getDescription())
                                .build())
                        .toList();

        return AccessManagementDto.RoleResponse.builder()
                .roleId(role.getRoleId().toString())
                .tenantId(role.getTenantId())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(permissions)
                .build();
    }
}