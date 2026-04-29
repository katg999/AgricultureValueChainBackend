package com.ugaap.ugaap.dto;

// LoginResponse.java

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private long   accessTokenExpiresIn;
    private String tokenType;
    private String clientId;
    private String email;
    private String role;
}