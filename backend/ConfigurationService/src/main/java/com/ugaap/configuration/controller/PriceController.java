package com.ugaap.configuration.controller;

import com.ugaap.configuration.dto.PriceRequest;
import com.ugaap.configuration.dto.PriceResponse;
import com.ugaap.configuration.service.PriceService;
import com.ugaap.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/prices")
@RequiredArgsConstructor
public class PriceController {

    private final PriceService priceService;

    @PostMapping
    public ResponseEntity<ApiResponse<List<PriceResponse>>> setPrice(
            @Valid @RequestBody PriceRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Price configured", priceService.setPrice(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PriceResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.ok("Prices fetched", priceService.getAllPrices()));
    }

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<List<PriceResponse>>> getGlobal() {
        return ResponseEntity.ok(
                ApiResponse.ok("Global prices fetched", priceService.getGlobalPrices()));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<PriceResponse>>> getByBranch(
            @PathVariable UUID branchId) {
        return ResponseEntity.ok(
                ApiResponse.ok("Branch prices fetched",
                        priceService.getPricesForBranch(branchId)));
    }
}