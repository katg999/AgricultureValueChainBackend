package com.ugaap.authentication.controller;

import com.ugaap.authentication.dto.*;
import com.ugaap.authentication.service.AuthService;
import com.ugaap.shared.Exception.AuthException;
import com.ugaap.authentication.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.ugaap.shared.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;




    // POST /auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        LoginResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(
                ApiResponse.ok("Login successful", response));
    }

    // POST /auth/logout
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest httpRequest) {

        String token = extractBearerToken(httpRequest);
        authService.logout(token, httpRequest);
        return ResponseEntity.ok(
                ApiResponse.ok("Logged out successfully", null));
    }

    // POST /auth/refresh
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @Valid @RequestBody RefreshRequest request,
            HttpServletRequest httpRequest) {

        LoginResponse response = authService.refresh(request, httpRequest);
        return ResponseEntity.ok(
                ApiResponse.ok("Token refreshed", response));
    }


    // GET /password-reset/request

    @PostMapping("/password-reset/request")
    public ResponseEntity<ApiResponse<Void>> requestOtp(@Valid @RequestBody OtpRequest.Request request) {
        otpService.generateAndSendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("OTP sent to your email", null));
    }

    // POST /password-reset/verify
    @PostMapping("/password-reset/verify")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody OtpRequest.Verify request) {
        otpService.verifyAndResetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok("Password reset successful", null));
    }



    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        throw new AuthException("No Bearer token found");
    }
}