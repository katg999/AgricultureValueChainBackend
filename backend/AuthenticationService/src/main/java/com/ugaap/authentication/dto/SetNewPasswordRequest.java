package com.ugaap.authentication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SetNewPasswordRequest {
    @NotBlank
    private String verifiedToken;
    @NotBlank @Size(min = 8) private String newPassword;
}
