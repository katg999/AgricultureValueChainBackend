package com.ugaap.membership.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

public class AccessManagementDto {

    // ── User DTOs ─────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateUserRequest {

        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        private String phone;

        @NotBlank(message = "Tenant ID is required")
        private String tenantId;

        private UUID branchId; // null = cooperative-wide

        @NotNull(message = "Role ID is required")
        private UUID roleId;
        private String dateOfBirth;
        private String nationalId;
        private String gender;
    }


    @Data
    @Builder
    public static class UserResponse {
        private String  userId;
        private String  username;
        private String  fullName;
        private String  email;
        private String  phone;
        private String  tenantId;
        private String  branchId;
        private String  roleName;
        private String  status;
        private boolean mustChangePassword;
        private String  temporaryPassword; // only populated on creation
    }

    // ── Role DTOs ─────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRoleRequest {

        @NotBlank(message = "Role name is required")
        private String name;

        private String description;
        private String tenantId; // null = platform-wide

        @NotNull(message = "Permissions are required")
        private List<PermissionRequest> permissions;
    }

    @Data
    @Builder
    public static class RoleResponse {
        private String                   roleId;
        private String                   tenantId;
        private String                   name;
        private String                   description;
        private List<PermissionResponse> permissions;
    }

    // ── Permission DTOs ───────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionRequest {
        @NotBlank private String module;
        @NotBlank private String action;
        private String description;
    }




    @Data
    @Builder
    public static class PermissionResponse {
        private String permissionId;
        private String module;
        private String action;
        private String description;
    }

    // ── Token claims (internal) ───────────────────────────────

    public record TokenClaimsResponse(
            String userId,
            String username,
            String tenantId,
            String branchId,
            List<String> roles,
            List<String> permissions
    ) {}
}