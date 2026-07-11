package com.ugaap.membership.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

public class BranchDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotBlank(message = "Branch name is required")
        private String name;

        @NotBlank(message = "Tenant ID is required")
        private String tenantId;

        @NotBlank(message = "Registration number is required")
        private String registrationNumber;

        @NotBlank(message = "Town/Area is required")
        private String location;

        @NotBlank(message = "Region is required")
        private String region;

        @NotBlank(message = "Country is required")
        private String country;

        @NotBlank(message = "Established date is required")
        private String establishedDate;

        @NotBlank(message = "Physical address is required")
        private String address;

        @NotBlank(message = "P.O. Box is required")
        private String poBox;
    }

    @Data
    @Builder
    public static class Response {
        private String branchId;
        private String name;
        private String tenantId;
        private String location;
        private String branchCode;
        private String registrationNumber;
        private String region;
        private String country;
        private String establishedDate;
        private String address;
        private String poBox;
        private String status;
        private String createdAt;
    }
}