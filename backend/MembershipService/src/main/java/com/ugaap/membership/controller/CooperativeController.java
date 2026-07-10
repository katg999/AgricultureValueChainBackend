package com.ugaap.membership.controller;

import com.ugaap.membership.dto.CooperativeDto;
import com.ugaap.membership.service.CooperativeService;
import com.ugaap.shared.security.UgaapSecurityContext;  // look here
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@RestController
@RequestMapping("/api/v1/cooperatives")
@RequiredArgsConstructor
public class  CooperativeController {

    private final CooperativeService cooperativeService;
    private final UgaapSecurityContext securityContext;
    private final ObjectMapper objectMapper;

    /**
     * Onboard a new cooperative.
     * Creates the cooperative, a default HQ branch, and seeds the initial Cooperative Admin account.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<CooperativeDto.CreateResponse> onboardCooperative(
            @RequestPart("data") String requestJson,
            @RequestPart(value = "adminPhoto", required = false) MultipartFile adminPhoto
    ) throws Exception {
        CooperativeDto.CreateRequest request =
                objectMapper.readValue(requestJson, CooperativeDto.CreateRequest.class);

        String currentUser = securityContext.currentUsername();
        CooperativeDto.CreateResponse response =
                cooperativeService.onboardCooperative(request, adminPhoto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or hasRole('COOPERATIVE_ADMIN_MAKER') or hasRole('COOPERATIVE_ADMIN_CHECKER')")
    public ResponseEntity<List<CooperativeDto.Response>> listCooperatives() {
        return ResponseEntity.ok(cooperativeService.listCooperatives());
    }


}
