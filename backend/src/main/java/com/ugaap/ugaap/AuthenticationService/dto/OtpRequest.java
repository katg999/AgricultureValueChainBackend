package com.ugaap.ugaap.AuthenticationService.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class OtpRequest {
    @Data
    public static class Request {
        @Email
        @NotBlank
        private String email;
    }

    @Data
    public static class Verify {
        @Email
        @NotBlank
        private String email;
        @NotBlank
        private String otp;
        @NotBlank
        private String newPassword;
    }
}