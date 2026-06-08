package com.ugaap.membership.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class MakerCheckerDto {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateRequest {
        // Maker fields
        private String makerFullName;
        private String makerEmail;
        private String makerPhone;
        private String makerDateOfBirth;
        private String makerNationalId;
        private String makerGender;

        // Checker fields
        private String checkerFullName;
        private String checkerEmail;
        private String checkerPhone;
        private String checkerDateOfBirth;
        private String checkerNationalId;
        private String checkerGender;

        // Shared
        private String tenantId;
        private String cooperativeId;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AccountCredentials {
        private String userId;
        private String username;
        private String fullName;
        private String email;
        private String temporaryPassword;
        private String role;
        private String photoUrl;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateResponse {
        private AccountCredentials maker;
        private AccountCredentials checker;
        private String message;
    }
}