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


    // Step 1: validate credentials, send OTP
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TempTokenResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        TempTokenResponse response = authService.loginStep1(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("OTP sent to your email", response));
    }


    // Step 2: verify OTP, get full tokens
    @PostMapping("/login/verify-otp")
    public ResponseEntity<ApiResponse<LoginResponse>> verifyLoginOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            HttpServletRequest httpRequest) {
        LoginResponse response = authService.loginStep2(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
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


    // Step 1 — user submits email or phone → OTP sent
    @PostMapping("/password-reset/request")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(
            @Valid @RequestBody OtpRequest.Request request) {
        otpService.generateAndSendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("OTP sent to your registered email", null));
    }

    // Step 2 — user submits OTP → get verifiedToken back
    @PostMapping("/password-reset/verify-otp")
    public ResponseEntity<ApiResponse<PasswordResetVerifyResponse>> verifyPasswordResetOtp(
            @Valid @RequestBody OtpRequest.Verify request) {
        String verifiedToken = otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("OTP verified",
                new PasswordResetVerifyResponse(verifiedToken)));
    }


    // Step 3 — user submits new password with verifiedToken
    @PostMapping("/password-reset/set-password")
    public ResponseEntity<ApiResponse<Void>> setNewPassword(
            @Valid @RequestBody SetNewPasswordRequest request) {
        otpService.resetPassword(request.getVerifiedToken(), request.getNewPassword());
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