package com.ugaap.ugaap.InventoryService.controller;

import com.ugaap.ugaap.InventoryService.dto.InputStockDTO;
import com.ugaap.ugaap.InventoryService.dto.InputStockResponseDTO;
import com.ugaap.ugaap.InventoryService.service.InputStockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// REST controller for managing input stock (fertilizer, seeds, chemicals, etc.)
// This is where we create and manage inventory for agricultural inputs
@RestController
@RequestMapping("/api/input-stock")
@RequiredArgsConstructor
@Tag(name = "Input Stock", description = "Input stock management APIs")
public class InputStockController {
    private final InputStockService inputStockService;

    // Add new stock to inventory - creates the input stock record
    // Short code and total value are auto-generated
    @Operation(summary = "Add new input stock")
    @PostMapping
    public ResponseEntity<InputStockResponseDTO> addStock(@Valid @RequestBody InputStockDTO dto) {
        InputStockResponseDTO response = inputStockService.addStock(dto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Get specific stock record by ID
    @Operation(summary = "Get stock by ID")
    @GetMapping("/{id}")
    public ResponseEntity<InputStockResponseDTO> getStockById(@PathVariable UUID id) {
        return ResponseEntity.ok(inputStockService.getStockById(id));
    }

    // Get all stock records - can filter by cooperative or branch via query params
    @Operation(summary = "Get all stock records - optionally filter by cooperative or branch")
    @GetMapping("/all")
    public ResponseEntity<List<InputStockResponseDTO>> getAllStock(
            @RequestParam(required = false) UUID cooperativeId,
            @RequestParam(required = false) UUID branchId) {
        if (cooperativeId != null) {
            return ResponseEntity.ok(inputStockService.getStockByCooperative(cooperativeId));
        }
        if (branchId != null) {
            return ResponseEntity.ok(inputStockService.getStockByBranch(branchId));
        }
        return ResponseEntity.ok(inputStockService.getAllStock());
    }

    // Get stock records for a specific input item type - to see stock levels for one item
    @Operation(summary = "Get stock by input item ID")
    @GetMapping("/item/{inputItemId}")
    public ResponseEntity<List<InputStockResponseDTO>> getStockByInputItem(@PathVariable UUID inputItemId) {
        return ResponseEntity.ok(inputStockService.getStockByInputItem(inputItemId));
    }

    // Search stock by item name - type partial name to find matching stock
    @Operation(summary = "Search stock by item name")
    @GetMapping("/search")
    public ResponseEntity<List<InputStockResponseDTO>> searchStockByName(@RequestParam String itemName) {
        return ResponseEntity.ok(inputStockService.searchStockByName(itemName));
    }

    // Delete stock record - only allowed if available quantity is zero
    @Operation(summary = "Delete input stock")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable UUID id) {
        inputStockService.deleteStock(id);
        return ResponseEntity.noContent().build();
    }
}