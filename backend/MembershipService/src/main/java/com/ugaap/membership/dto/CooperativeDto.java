package com.ugaap.membership.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class CooperativeDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotBlank(message = "Cooperative name is required")
        private String name;

        @NotBlank(message = "Registration number is required")
        private String registrationNumber;

        @NotBlank(message = "Address is required")
        private String address;

        @NotBlank(message = "Account Name name is required")
        private String  accountName;

        @NotBlank(message = "Account  Number is required")
        private String accountNumber;

        @NotBlank(message = "Bank Branch Is Required")
        private String bankBranch;

        private String poBox;
        private String websiteUrl;
        private String country;

        @NotBlank(message = "Default branch name is required")
        private String defaultBranchName;

        private String defaultBranchLocation;

        // ── Cooperative Admin (Maker) ──────────────────────────
        @NotBlank(message = "Admin full name is required")
        private String adminFullName;

        @NotBlank(message = "Admin email is required")
        @Email(message = "Invalid email format")
        private String adminEmail;

        @NotBlank(message = "Admin phone is required")
        private String adminPhone;

        private String adminDateOfBirth;   // "YYYY-MM-DD", optional
        private String adminNationalId;    // optional
        private String adminGender;        // optional
    }

    @Data
    @Builder
    public static class CreateResponse {
        private String tenantId;
        private String cooperativeId;
        private String defaultBranchId;
        private String defaultBranchCode;
        private String message;

        // Admin credentials, returned once ──────────────────
        private String adminUserId;
        private String adminUsername;
        private String adminEmail;
        private String adminTemporaryPassword;
    }

    @Data
    public static class Response {
        private String cooperativeId;
        private String tenantId;
        private String name;
        private String registrationNumber;
        private String address;
        private String accountName;
        private String accountNumber;
        private String bankBranch;
        private String status;
        private String createdAt;
    }
}