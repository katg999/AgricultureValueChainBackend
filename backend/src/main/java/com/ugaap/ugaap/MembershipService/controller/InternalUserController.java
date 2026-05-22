package com.ugaap.ugaap.MembershipService.controller;

import com.ugaap.ugaap.MembershipService.dto.AccessManagementDto;
import com.ugaap.ugaap.MembershipService.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @GetMapping("/{userId}/token-claims")
    public ResponseEntity<AccessManagementDto.TokenClaimsResponse> getTokenClaims(
            @PathVariable String userId) {
        AccessManagementDto.TokenClaimsResponse claims =
                userService.getTokenClaims(userId);
        return ResponseEntity.ok(claims);
    }

    // ── DTO ───────────────────────────────────────────────────

    public record TokenClaimsResponse(
            String userId,
            String username,
            String tenantId,
            String branchId,
            List<String> roles,
            List<String> permissions
    ) {}
}