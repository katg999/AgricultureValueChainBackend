package com.ugaap.membership.controller;

import com.ugaap.membership.dto.BranchDto;
import com.ugaap.membership.service.BranchService;
import com.ugaap.shared.security.UgaapSecurityContext; // look here
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;
    private final UgaapSecurityContext securityContext;

    @PostMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER') or hasRole('COOPERATIVE_ADMIN_CHECKER')")
    public ResponseEntity<BranchDto.Response> createBranch(
            @Valid @RequestBody BranchDto.CreateRequest request) {
        String createdBy = securityContext.currentUsername();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(branchService.createBranch(request, createdBy));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BranchDto.Response>> listBranches(
            @RequestParam String tenantId) {
        return ResponseEntity.ok(branchService.listBranches(tenantId));
    }

    @GetMapping("/{branchId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BranchDto.Response> getBranch(
            @PathVariable String branchId) {
        return ResponseEntity.ok(branchService.getBranch(branchId));
    }
}