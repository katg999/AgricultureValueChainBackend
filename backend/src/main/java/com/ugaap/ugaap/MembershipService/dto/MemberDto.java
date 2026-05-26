package com.ugaap.ugaap.MembershipService.dto;

import com.ugaap.ugaap.MembershipService.Entity.Member;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class MemberDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        // ── Personal Details ──────────────────────────────────

        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "National ID is required")
        private String nationalId;

        @NotBlank(message = "Phone number is required")
        private String phoneNumber;

        @NotNull(message = "Gender is required")
        private Member.Gender gender;

        private String email;

        private LocalDate dateOfBirth;

        // ── Location Details ──────────────────────────────────

        @NotNull(message = "Farm region is required")
        private Member.FarmRegion farmRegion;

        private String villageTown;

        // ── Farm Details ──────────────────────────────────────

        private BigDecimal totalLandAreaHectares;

        private Member.LandOwnershipType landOwnershipType;

        // ── Production Details ────────────────────────────────

        private List<Member.PrimaryCrop> primaryCrops;

        @Builder.Default
        private int cattleCount = 0;

        @Builder.Default
        private int goatsCount = 0;

        @Builder.Default
        private int poultryCount = 0;

        // ── Cooperative Assignment ────────────────────────────

        @NotBlank(message = "Tenant ID is required")
        private String tenantId;

        @NotNull(message = "Branch ID is required")
        private UUID branchId;

        @NotNull(message = "Cooperative ID is required")
        private UUID cooperativeId;
    }

    @Data
    @Builder
    public static class Response {
        private String memberId;
        private String fullName;
        private String nationalId;
        private String phoneNumber;
        private String gender;
        private String email;
        private String dateOfBirth;
        private String profilePhotoUrl;
        private String farmRegion;
        private String villageTown;
        private BigDecimal totalLandAreaHectares;
        private String landOwnershipType;
        private List<String> primaryCrops;
        private int cattleCount;
        private int goatsCount;
        private int poultryCount;
        private String cooperativeId;
        private String tenantId;
        private String branchId;
        private String status;
        private String registeredBy;
        private String createdAt;
    }
}