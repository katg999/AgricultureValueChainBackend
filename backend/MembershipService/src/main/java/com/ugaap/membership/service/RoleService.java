package com.ugaap.membership.service;

import com.ugaap.membership.Entity.Permission;
import com.ugaap.membership.Entity.Role;
import com.ugaap.membership.dto.AccessManagementDto;
import com.ugaap.membership.repository.PermissionRepository;
import com.ugaap.membership.repository.RoleRepository;
import com.ugaap.shared.Exception.AuthException; // look here
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

    // ── Create role with permissions ─────────────────────────

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

        Set<Permission> permissions = resolvePermissions(request.getPermissions());

        Role role = Role.builder()
                .tenantId(request.getTenantId())
                .name(request.getName())
                .description(request.getDescription())
                .permissions(permissions)
                .build();

        roleRepository.save(role);
        log.info("Role created: name={}, tenantId={}, permissionCount={}",
                request.getName(), request.getTenantId(), permissions.size());

        return mapToResponse(role);
    }

    // ── List roles (scoped to tenant) ─────────────────────────

    public List<AccessManagementDto.RoleResponse> listRoles(String tenantId) {
        return roleRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::mapToResponse)
                .toList();
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

    // ── Helpers ───────────────────────────────────────────────

    private Set<Permission> resolvePermissions(List<AccessManagementDto.PermissionRequest> requests) {
        Set<Permission> permissions = new HashSet<>();

        for (AccessManagementDto.PermissionRequest pr : requests) {

            // Split comma-separated modules and actions, allowing either comma-separated
            // values or individual objects from the frontend
            String[] modules = pr.getModule().split(",");
            String[] actions = pr.getAction().split(",");

            for (String moduleStr : modules) {
                for (String actionStr : actions) {
                    Permission.Module module = Permission.Module.valueOf(moduleStr.trim());
                    Permission.Action action = Permission.Action.valueOf(actionStr.trim());

                    Permission permission = permissionRepository
                            .findByModuleAndAction(module, action)
                            .orElseGet(() -> permissionRepository.save(
                                    Permission.builder()
                                            .module(module)
                                            .action(action)
                                            .description(pr.getDescription())
                                            .build()
                            ));
                    permissions.add(permission);
                }
            }
        }

        return permissions;
    }

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

    // RoleService
    @Transactional
    public AccessManagementDto.RoleResponse updateRole(String roleId, AccessManagementDto.CreateRoleRequest request) {
        Role role = roleRepository.findById(UUID.fromString(roleId))
                .orElseThrow(() -> new AuthException("Role not found: " + roleId));
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setPermissions(resolvePermissions(request.getPermissions()));
        roleRepository.save(role);
        log.info("Role updated: roleId={}, permissionCount={}", roleId, role.getPermissions().size());
        return mapToResponse(role);
    }
}