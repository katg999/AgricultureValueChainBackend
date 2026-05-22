package com.ugaap.ugaap.AuthenticationService.dto;

// LoginResponse.java

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private long   accessTokenExpiresIn;
    private String tokenType;
    private String clientId;
    private String userId;
    private String username;
    private String email;
    private List<String> roles;
}