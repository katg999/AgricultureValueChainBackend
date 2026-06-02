package com.ugaap.ugaap.MembershipService.controller;

import com.ugaap.ugaap.MembershipService.dto.CooperativeDto;
import com.ugaap.ugaap.MembershipService.service.CooperativeService;
import com.ugaap.ugaap.shared.security.UgaapSecurityContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;


@RestController
@RequestMapping("/api/v1/cooperatives")
@RequiredArgsConstructor
public class  CooperativeController {

    private final CooperativeService cooperativeService;
    private final UgaapSecurityContext securityContext;

    /**
     * Onboard a new cooperative.
     * Creates the cooperative, a default HQ branch, and seeds the initial Cooperative Admin account.
     */
    @PostMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<CooperativeDto.CreateResponse> onboardCooperative(
            @Valid @RequestBody CooperativeDto.CreateRequest request
    ) {
        String currentUser = securityContext.currentUsername();
        CooperativeDto.CreateResponse response = cooperativeService.onboardCooperative(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER') or hasRole('COOPERATIVE_ADMIN_CHECKER')")
    public ResponseEntity<List<CooperativeDto.Response>> listCooperatives() {
        return ResponseEntity.ok(cooperativeService.listCooperatives());
    }


}
