package com.ugaap.membership.controller;

import com.ugaap.membership.Entity.Permission;
import com.ugaap.membership.dto.AccessManagementDto;
import com.ugaap.membership.service.RoleService;
import com.ugaap.membership.service.UserService;
import com.ugaap.shared.security.RequiresPermission; // look here
import com.ugaap.shared.security.UgaapSecurityContext; // look here
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/access")
@RequiredArgsConstructor
public class AccessManagementController {

    private final UserService          userService;
    private final RoleService          roleService;
    private final UgaapSecurityContext securityContext;

    // ── Users ─────────────────────────────────────────────────

    @PostMapping("/users")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER')")
    public ResponseEntity<AccessManagementDto.UserResponse> createUser(
            @Valid @RequestBody AccessManagementDto.CreateUserRequest request) {

        String createdBy = securityContext.currentUsername();
        AccessManagementDto.UserResponse response =
                userService.createUser(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER') or hasRole('COOPERATIVE_ADMIN_CHECKER')")
    public ResponseEntity<AccessManagementDto.UserResponse> getUser(
            @PathVariable String userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER') or hasRole('COOPERATIVE_ADMIN_CHECKER')")
    public ResponseEntity<List<AccessManagementDto.UserResponse>> listUsers(
            @RequestParam String tenantId) {
        return ResponseEntity.ok(userService.listUsers(tenantId));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER')")
    public ResponseEntity<Void> deactivateUser(@PathVariable String userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    // ── Roles ─────────────────────────────────────────────────

    @PostMapping("/roles")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER')")
    public ResponseEntity<AccessManagementDto.RoleResponse> createRole(
            @Valid @RequestBody AccessManagementDto.CreateRoleRequest request) {

        String createdBy = securityContext.currentUsername();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roleService.createRole(request, createdBy));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER') or hasRole('COOPERATIVE_ADMIN_CHECKER')")
    public ResponseEntity<List<AccessManagementDto.RoleResponse>> listRoles(
            @RequestParam String tenantId) {
        return ResponseEntity.ok(roleService.listRoles(tenantId));
    }

    @DeleteMapping("/roles/{roleId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> deleteRole(@PathVariable String roleId) {
        roleService.deleteRole(roleId);
        return ResponseEntity.noContent().build();
    }


    // AccessManagementController
    @PutMapping("/roles/{roleId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER')")
    public ResponseEntity<AccessManagementDto.RoleResponse> updateRole(
            @PathVariable String roleId,
            @Valid @RequestBody AccessManagementDto.CreateRoleRequest request) {
        return ResponseEntity.ok(roleService.updateRole(roleId, request));
    }
}