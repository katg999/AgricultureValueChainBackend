package com.ugaap.ugaap.MembershipService.controller;

import com.ugaap.ugaap.MembershipService.Entity.Permission;
import com.ugaap.ugaap.MembershipService.dto.AccessManagementDto;
import com.ugaap.ugaap.MembershipService.service.RoleService;
import com.ugaap.ugaap.MembershipService.service.UserService;
import com.ugaap.ugaap.shared.security.RequiresPermission;
import com.ugaap.ugaap.shared.security.UgaapSecurityContext;
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

    private final UserService         userService;
    private final RoleService         roleService;
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

    @PostMapping("/roles/{roleId}/permissions")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER')")
    public ResponseEntity<AccessManagementDto.RoleResponse> assignPermissions(
            @PathVariable String roleId,
            @Valid @RequestBody AccessManagementDto.AssignPermissionsRequest request) {
        return ResponseEntity.ok(
                roleService.assignPermissions(roleId, request));
    }

    @DeleteMapping("/roles/{roleId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> deleteRole(@PathVariable String roleId) {
        roleService.deleteRole(roleId);
        return ResponseEntity.noContent().build();
    }
// These are Test Endpoints

    @GetMapping("/test/membership-view")
    @RequiresPermission(module = Permission.Module.MEMBERSHIP, action = Permission.Action.VIEW)
    public ResponseEntity<String> testMembershipView() {
        return ResponseEntity.ok("Access granted — you have MEMBERSHIP:VIEW permission");
    }

    @GetMapping("/test/inventory-view")
    @RequiresPermission(module = Permission.Module.INVENTORY, action = Permission.Action.VIEW)
    public ResponseEntity<String> testInventoryView() {
        return ResponseEntity.ok("Access granted — you have INVENTORY:VIEW permission");
    }

}