package com.ugaap.membership.dto;

import com.ugaap.membership.Entity.Member;
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

        @NotNull(message = "IrrigationSource is required")
        private Member.IrrigationSource irrigationSource;

        private String email;

        private LocalDate dateOfBirth;

        // ── Location Details ──────────────────────────────────

        @NotNull(message = "Farm Location is required")
        private Member.FarmLocation farmLocation;

        private String villageTown;

        // ── Farm Details ──────────────────────────────────────

        private BigDecimal totalLandAreaHectares;

        private Member.LandOwnershipType landOwnershipType;

        // ── Production Details ────────────────────────────────

        private List<Member.PrimaryCrop> primaryCrops;

        private String commodityToDeliver;
        private String livestockKept;



       //payment details
       @NotNull(message = "Payment method is required")
       private Member.PaymentMethodType paymentMethodType;

        private String bankName;
        private String bankBranch;
        private String accountHolderName;
        private String accountNumber;
        private String walletNumber;

        // ── Cooperative Assignment ────────────────────────────

        @NotBlank(message = "Tenant ID is required")
        private String tenantId;

        @NotNull(message = "Branch ID is required")
        private String branchId;

        @NotNull(message = "Cooperative ID is required")
        private String cooperativeId;
    }




    @Data
    @Builder
    public static class Response {
        private String memberId;
        private String fullName;
        private String memberCode;
        private String nationalId;
        private String phoneNumber;
        private String gender;
        private String irrigationSource;
        private String email;
        private String dateOfBirth;
        private String profilePhotoUrl;
        private String farmLocation;
        private String villageTown;
        private BigDecimal totalLandAreaHectares;
        private String landOwnershipType;
        private String cooperativeId;
        private String tenantId;
        private String branchId;
        private String status;
        private String registeredBy;
        private String createdAt;
        private String bankName;
        private String bankBranch;
        private String accountHolderName;
        private String accountNumber;
        private String walletNumber;
        private String commodityToDeliver;
        private String livestockKept;
        private String paymentMethodType;
        private String branchName;

    }
}