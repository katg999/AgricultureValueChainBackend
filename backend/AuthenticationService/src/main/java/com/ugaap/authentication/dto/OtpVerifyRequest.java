package com.ugaap.authentication.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank private String tempToken;
    @NotBlank
    private String otp;

}
