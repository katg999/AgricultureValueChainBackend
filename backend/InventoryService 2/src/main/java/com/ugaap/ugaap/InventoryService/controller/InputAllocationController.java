package com.ugaap.ugaap.InventoryService.controller;

import com.ugaap.ugaap.InventoryService.dto.InputAllocationDTO;
import com.ugaap.ugaap.InventoryService.dto.InputAllocationResponseDTO;
import com.ugaap.ugaap.InventoryService.service.InputAllocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// REST controller for input allocations
// Handles issuing inputs, acknowledgment, and recovery tracking
@RestController
@RequestMapping("/api/allocations")
@RequiredArgsConstructor
@Tag(name = "Input Allocations", description = "Issue inputs to farmers, acknowledge receipt and track recoveries")
public class InputAllocationController {
    private final InputAllocationService allocationService;

    // Issue new inputs to a farmer
    @Operation(summary = "Issue new inputs to a farmer")
    @PostMapping("/issue")
    public ResponseEntity<InputAllocationResponseDTO> issueInput(@Valid @RequestBody InputAllocationDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(allocationService.issueInput(dto));
    }

    // Farmer acknowledgment of receipt
    @Operation(summary = "Farmer acknowledgment of receipt")
    @PostMapping("/{allocationId}/acknowledge")
    public ResponseEntity<InputAllocationResponseDTO> acknowledgeReceipt(@PathVariable UUID allocationId,
            @RequestParam UUID performedBy) {
        return ResponseEntity.ok(allocationService.acknowledgeReceipt(allocationId, performedBy));
    }

    // Record input recovery from farmer
    @Operation(summary = "Record input recovery from farmer")
    @PostMapping("/{allocationId}/recover")
    public ResponseEntity<Void> recordRecovery(@PathVariable UUID allocationId,
            @RequestParam Double quantity) {
        allocationService.recordRecovery(allocationId, quantity);
        return ResponseEntity.ok().build();
    }

    // Get allocation by ID
    @Operation(summary = "Get allocation by ID")
    @GetMapping("/{id}")
    public ResponseEntity<InputAllocationResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(allocationService.getAllocationById(id));
    }

    // Get allocations by cooperative or branch
    @Operation(summary = "Get allocations by cooperative ID")
    @GetMapping("/cooperative/{cooperativeId}")
    public ResponseEntity<List<InputAllocationResponseDTO>> getByCooperative(@PathVariable UUID cooperativeId) {
        return ResponseEntity.ok(allocationService.getAllocationsByCooperative(cooperativeId));
    }

    @Operation(summary = "Get allocations by branch ID")
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<InputAllocationResponseDTO>> getByBranch(@PathVariable UUID branchId) {
        return ResponseEntity.ok(allocationService.getAllocationsByBranch(branchId));
    }

    // Get allocations for a farmer - needed for auto-detection in CollectionService
    @Operation(summary = "Get allocations by farmer ID (for auto-detection)")
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<InputAllocationResponseDTO>> getByFarmer(@PathVariable UUID farmerId) {
        return ResponseEntity.ok(allocationService.getAllocationsByFarmer(farmerId));
    }

    // Search allocations by farmer identifier (UUID) or name - unified search
    @Operation(summary = "Search allocations by farmer identifier or name")
    @GetMapping("/search")
    public ResponseEntity<List<InputAllocationResponseDTO>> searchAllocations(@RequestParam String query) {
        return ResponseEntity.ok(allocationService.searchAllocations(query));
    }

    // Get today's issuances for a cooperative
    @Operation(summary = "Get today's issuances for a cooperative")
    @GetMapping("/today/cooperative/{cooperativeId}")
    public ResponseEntity<List<InputAllocationResponseDTO>> getTodayIssuances(@PathVariable UUID cooperativeId) {
        return ResponseEntity.ok(allocationService.getTodaysIssuances(cooperativeId));
    }
}