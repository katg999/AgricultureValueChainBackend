package com.ugaap.ugaap.InventoryService.Controller;

import com.ugaap.ugaap.InventoryService.DTO.InventoryItemCreateDto;
import com.ugaap.ugaap.InventoryService.DTO.InventoryItemDto;
import com.ugaap.ugaap.InventoryService.DTO.InventoryItemUpdateDto;
import com.ugaap.ugaap.InventoryService.DTO.StockAdjustmentDto;
import com.ugaap.ugaap.InventoryService.Service.InventoryItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory/items")
@RequiredArgsConstructor
@Tag(name = "Inventory Items", description = "Manage stock items — fertilisers, seeds, pesticides, etc.")
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    @Operation(summary = "List all stock items. Supports ?category= and ?search= filters.")
    @GetMapping
    public ResponseEntity<Page<InventoryItemDto>> listItems(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(inventoryItemService.listItems(branchId, category, search, pageable));
    }

    @Operation(summary = "Add a new stock item to the branch inventory.")
    @PostMapping
    public ResponseEntity<?> createItem(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111", required = true)
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            @Parameter(in = ParameterIn.HEADER, name = "X-Cooperative-Id",
                       description = "Cooperative UUID", example = "22222222-2222-2222-2222-222222222222", required = true)
            @RequestHeader(value = "X-Cooperative-Id", required = false) UUID cooperativeId,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody InventoryItemCreateDto dto) {
        log.info("POST /items — X-Branch-Id={} X-Cooperative-Id={} X-User-Id={}", branchId, cooperativeId, userId);
        if (branchId == null || cooperativeId == null) {
            return ResponseEntity.badRequest()
                    .body("X-Branch-Id and X-Cooperative-Id headers are required.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryItemService.createItem(dto, branchId, cooperativeId, userId));
    }

    @Operation(summary = "Get a single stock item by ID.")
    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemDto> getItem(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryItemService.getItem(id));
    }

    @Operation(summary = "Update item details — price, reorder level, unit of measure.")
    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemDto> updateItem(
            @PathVariable UUID id,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody InventoryItemUpdateDto dto) {
        return ResponseEntity.ok(inventoryItemService.updateItem(id, dto, userId));
    }

    @Operation(summary = "Adjust stock quantity. Positive delta = restock, negative = reduction.")
    @PatchMapping("/{id}/stock")
    public ResponseEntity<InventoryItemDto> adjustStock(
            @PathVariable UUID id,
            @Parameter(in = ParameterIn.HEADER, name = "X-User-Id",
                       description = "User UUID", example = "33333333-3333-3333-3333-333333333333")
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Valid @RequestBody StockAdjustmentDto dto) {
        return ResponseEntity.ok(inventoryItemService.adjustStock(id, dto, userId));
    }

    @Operation(summary = "Return items where quantityAvailable ≤ reorderLevel.")
    @GetMapping("/low-stock")
    public ResponseEntity<Page<InventoryItemDto>> getLowStockItems(
            @Parameter(in = ParameterIn.HEADER, name = "X-Branch-Id",
                       description = "Branch UUID", example = "11111111-1111-1111-1111-111111111111")
            @RequestHeader(value = "X-Branch-Id", required = false) UUID branchId,
            Pageable pageable) {
        return ResponseEntity.ok(inventoryItemService.getLowStockItems(branchId, pageable));
    }
}
