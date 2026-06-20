package com.ugaap.ugaap.CollectionService.Controller;

import com.ugaap.ugaap.CollectionService.DTO.FarmerSearchResultDTO;
import com.ugaap.ugaap.CollectionService.Service.FarmerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Version 1 (v1) of the Farmer Local Registry API.
 * Provides lookup mechanisms for collection agents to link produce deliveries to specific users.
 */
@RestController
@RequestMapping("/api/v1/farmers")
@RequiredArgsConstructor
@Tag(name = "Farmers", description = "Read-only access and search for the local farmer registry")
public class FarmerController {

    private final FarmerService farmerService;

    @Operation(summary = "Search for farmers exclusively by first or last name")
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_VIEW_FARMERS')")
    public ResponseEntity<List<FarmerSearchResultDTO>> searchFarmers(
            @RequestParam String query) {
        // Query must be a human-readable name, no UUIDs or Shortcodes expected
        return ResponseEntity.ok(farmerService.searchFarmers(query));
    }
}