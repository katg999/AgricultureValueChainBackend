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

        private String location;
        private String branchCode;
    }

    @Data
    @Builder
    public static class Response {
        private String branchId;
        private String name;
        private String tenantId;
        private String location;
        private String branchCode;
        private String status;
        private String createdAt;
    }
}