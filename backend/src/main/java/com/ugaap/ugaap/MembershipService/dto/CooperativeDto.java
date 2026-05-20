package com.ugaap.ugaap.MembershipService.dto;

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

        @NotBlank(message = "Contact person name is required")
        private String contactPersonName;

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number")
        private String contactPersonPhone;

        @Email(message = "Invalid email address")
        private String contactPersonEmail;

        private String poBox;
        private String websiteUrl;
        private String country;

        @NotBlank(message = "Default branch name is required")
        private String defaultBranchName;

        private String defaultBranchLocation;
    }

    @Data
    @Builder
    public static class CreateResponse {
        private String tenantId;
        private String cooperativeId;
        private String defaultBranchId;
        private String defaultBranchCode;
        private String message;
    }

    @Data
    public static class Response {
        private String cooperativeId;
        private String tenantId;
        private String name;
        private String registrationNumber;
        private String address;
        private String contactPersonName;
        private String contactPersonPhone;
        private String contactPersonEmail;
        private String status;
        private String createdAt;
    }
}