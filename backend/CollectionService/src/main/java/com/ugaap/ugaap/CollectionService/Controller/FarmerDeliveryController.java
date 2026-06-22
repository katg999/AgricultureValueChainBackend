package com.ugaap.ugaap.CollectionService.Controller;

import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryCreateDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryListDTO;
import com.ugaap.ugaap.CollectionService.DTO.FarmerDeliveryUpdateDTO;
import com.ugaap.ugaap.CollectionService.Entity.FarmerDelivery;
import com.ugaap.ugaap.CollectionService.Repository.FarmerDeliveryRepository;
import com.ugaap.ugaap.CollectionService.Service.FarmerDeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Version 1 (v1) of the Farmer Delivery API.
 * Handles produce intake and updates. Note: Financial debt recovery is deliberately 
 * decoupled from these endpoints and processed via the SettlementController instead.
 */
@RestController
@RequestMapping("/api/v1/deliveries")
@RequiredArgsConstructor
@Tag(name = "Farmer Deliveries", description = "Manage produce ingestion and track linked financial recovery metrics")
public class FarmerDeliveryController {

    private final FarmerDeliveryService farmerDeliveryService;

    @Operation(summary = "Log a new produce delivery from a farmer")
    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CREATE_DELIVERY')")
    public ResponseEntity<FarmerDeliveryDTO> createDelivery(
            @Valid @RequestBody FarmerDeliveryCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(farmerDeliveryService.createFarmerDelivery(dto));
    }

@Operation(summary = "Retrieve a paginated list of all recorded deliveries")
@GetMapping("/paginated")
@PreAuthorize("hasAuthority('PERM_VIEW_DELIVERIES')")
public ResponseEntity<Page<FarmerDeliveryDTO>> getPaginatedDeliveries(
        @RequestParam(required = false) String farmerName,
        @RequestParam(required = false) String season,
        @RequestParam(required = false) String status,
        Pageable pageable) {

    // Defensive Check: Clean up bracketed array strings leaked by frontend data tables
    Pageable sanitizedPageable = pageable;
    if (pageable.getSort().isSorted()) {
        List<org.springframework.data.domain.Sort.Order> cleanOrders = new java.util.ArrayList<>();

        for (org.springframework.data.domain.Sort.Order order : pageable.getSort()) {
            String property = order.getProperty();

            // Strip out literal bracket and quote artifacts: ["branch"] -> branch
            if (property.contains("[") || property.contains("\"")) {
                property = property.replaceAll("[\\[\\]\"']", "").trim();
            }

            // Rebuild tracking sort definition rules
            cleanOrders.add(new org.springframework.data.domain.Sort.Order(order.getDirection(), property));
        }

        sanitizedPageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                org.springframework.data.domain.Sort.by(cleanOrders)
        );
    }

    // Build the dynamic specification criteria filter
    Specification<FarmerDelivery> spec = FarmerDeliveryRepository.FarmerDeliverySpecifications.withFilters(farmerName, season, status);

    // FIX: Extract entity rows safely from service layer mapping
    Page<FarmerDelivery> deliveryEntities = farmerDeliveryService.getAllPaginatedWithSpec(spec, sanitizedPageable);

    // FIX: Safely convert Page<FarmerDelivery> to outbound Page<FarmerDeliveryDTO> using internal service mappers
    Page<FarmerDeliveryDTO> dtoPage = deliveryEntities.map(farmerDeliveryService::convertToDTO);

    return ResponseEntity.ok(dtoPage);
}

    @Operation(summary = "Retrieve a lightweight list of all deliveries for reporting/export")
    @GetMapping("/export")
    @PreAuthorize("hasAuthority('PERM_EXPORT_DELIVERIES')")
    public ResponseEntity<List<FarmerDeliveryListDTO>> getAllDeliveriesForExport() {
        return ResponseEntity.ok(farmerDeliveryService.getAllFarmerDeliveriesWithTotalValue());
    }

    @Operation(summary = "Search deliveries strictly by a farmer's human-readable name")
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('PERM_VIEW_DELIVERIES')")
    public ResponseEntity<List<FarmerDeliveryDTO>> searchDeliveriesByName(
            @RequestParam String farmerName) {
        return ResponseEntity.ok(farmerDeliveryService.searchDeliveries(farmerName));
    }

    @Operation(summary = "Partially modify an existing delivery (e.g., updating quality specs or weights)")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_UPDATE_DELIVERY')")
    public ResponseEntity<FarmerDeliveryDTO> partialUpdateDelivery(
            @PathVariable UUID id,
            @Valid @RequestBody FarmerDeliveryUpdateDTO dto) {
        return ResponseEntity.ok(farmerDeliveryService.updateDelivery(id, dto));
    }

    @Operation(summary = "Permanently remove a delivery ledger entry")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DELETE_DELIVERY')")
    public ResponseEntity<Void> deleteDelivery(@PathVariable UUID id) {
        farmerDeliveryService.deleteFarmerDelivery(id);
        return ResponseEntity.noContent().build();
    }
}