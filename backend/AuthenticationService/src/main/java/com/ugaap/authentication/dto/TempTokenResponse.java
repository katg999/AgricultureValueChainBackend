package com.ugaap.authentication.dto;

import lombok.Builder;
import lombok.Data;

// dto/TempTokenResponse.java
@Data
@Builder
public class TempTokenResponse {
    private String tempToken;  // short-lived JWT or UUID stored in Redis
    private String message;
}
