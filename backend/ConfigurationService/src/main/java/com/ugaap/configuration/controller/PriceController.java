package com.ugaap.configuration.controller;

import com.ugaap.configuration.dto.FlatPriceRequest;
import com.ugaap.configuration.dto.GradePriceRequest;
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

    @PostMapping("/flat")
    public ResponseEntity<ApiResponse<PriceResponse>> setFlatPrice(
            @Valid @RequestBody FlatPriceRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Flat price configured", priceService.setFlatPrice(request)));
    }

    @PostMapping("/grade")
    public ResponseEntity<ApiResponse<PriceResponse>> setGradePrice(
            @Valid @RequestBody GradePriceRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Grade price configured", priceService.setGradePrice(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PriceResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.ok("Prices fetched", priceService.getAllPrices()));
    }

    @GetMapping("/branch/{branchName}")
    public ResponseEntity<ApiResponse<List<PriceResponse>>> getByBranch(
            @PathVariable String branchName) {
        return ResponseEntity.ok(
                ApiResponse.ok("Branch prices fetched",
                        priceService.getPricesForBranch(branchName)));
    }

    @GetMapping("/commodity/{commodityId}")
    public ResponseEntity<ApiResponse<List<PriceResponse>>> getByCommodity(
            @PathVariable UUID commodityId) {
        return ResponseEntity.ok(
                ApiResponse.ok("Commodity prices fetched",
                        priceService.getPricesForCommodity(commodityId)));
    }
}