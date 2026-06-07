package com.ugaap.membership.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ugaap.membership.dto.MakerCheckerDto;
import com.ugaap.membership.service.MakerCheckerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/maker-checker")
@RequiredArgsConstructor
public class MakerCheckerController {

    private final MakerCheckerService makerCheckerService;
    private final ObjectMapper        objectMapper;

    /**
     * POST /api/v1/maker-checker/setup
     *
     * Creates Maker and Checker accounts for a cooperative.
     * Returns system-generated credentials for both — shown once in a popup.
     * Only PLATFORM_ADMIN can call this endpoint.
     */
    @PostMapping(value = "/setup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<MakerCheckerDto.CreateResponse> setupMakerChecker(
            @RequestPart("data") String requestJson,
            @RequestPart(value = "makerPhoto",   required = false) MultipartFile makerPhoto,
            @RequestPart(value = "checkerPhoto", required = false) MultipartFile checkerPhoto)
            throws Exception {

        MakerCheckerDto.CreateRequest request =
                objectMapper.readValue(requestJson, MakerCheckerDto.CreateRequest.class);

        MakerCheckerDto.CreateResponse response =
                makerCheckerService.createMakerAndChecker(
                        request, makerPhoto, checkerPhoto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}