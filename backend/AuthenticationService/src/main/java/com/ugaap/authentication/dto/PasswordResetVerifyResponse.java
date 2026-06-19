package com.ugaap.authentication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PasswordResetVerifyResponse {
    private String verifiedToken;
}
