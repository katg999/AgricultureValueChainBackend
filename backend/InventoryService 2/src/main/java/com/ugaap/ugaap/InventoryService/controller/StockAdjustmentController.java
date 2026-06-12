package com.ugaap.ugaap.InventoryService.controller;

import com.ugaap.ugaap.InventoryService.dto.InputStockResponseDTO;
import com.ugaap.ugaap.InventoryService.dto.StockAdjustmentRequestDTO;
import com.ugaap.ugaap.InventoryService.service.InputStockService;
import com.ugaap.ugaap.InventoryService.service.InventoryTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Controller for manual stock adjustments - used when stock needs correction
// This is separate from issuance/recovery which happen through allocations
@RestController
@RequestMapping("/api/inventory/stock")
@RequiredArgsConstructor
@Tag(name = "Stock Operations", description = "Stock adjustment APIs")
public class StockAdjustmentController {

    private final InputStockService inputStockService;
    private final InventoryTransactionService inventoryTransactionService;

    // Manually adjust stock levels - for corrections or adjustments not tied to allocation
    // Transaction types: STOCK_IN (increase), STOCK_OUT (decrease)
    @Operation(summary = "Adjust stock (in/out) for an input stock")
    @PostMapping("/adjust/{inputStockId}")
    public ResponseEntity<InputStockResponseDTO> adjustStock(
            @PathVariable UUID inputStockId,
            @Valid @RequestBody StockAdjustmentRequestDTO request) {

        // Record the transaction and update available quantity
        inventoryTransactionService.recordTransaction(
                inputStockId,
                request.getTransactionType() != null ? request.getTransactionType() : "ADJUSTMENT",
                request.getQuantity(),
                request.getPerformedBy()
        );

        // Return updated stock level
        InputStockResponseDTO updatedStock = inputStockService.getStockById(inputStockId);
        return ResponseEntity.ok(updatedStock);
    }
}