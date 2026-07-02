package com.ugaap.configuration.controller;

import com.ugaap.configuration.dto.CommodityRequest;
import com.ugaap.configuration.dto.CommodityResponse;
import com.ugaap.configuration.service.CommodityService;
import com.ugaap.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/commodities")
@RequiredArgsConstructor
public class CommodityController {

    private final CommodityService commodityService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommodityResponse>> create(
            @Valid @RequestBody CommodityRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Commodity created", commodityService.createCommodity(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommodityResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.ok("Commodities fetched", commodityService.getAllCommodities()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommodityResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok("Commodity fetched", commodityService.getCommodityById(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        commodityService.deactivateCommodity(id);
        return ResponseEntity.ok(ApiResponse.ok("Commodity deactivated", null));
    }
}