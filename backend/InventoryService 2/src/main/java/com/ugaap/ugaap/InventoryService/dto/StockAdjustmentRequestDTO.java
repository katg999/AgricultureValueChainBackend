package com.ugaap.ugaap.InventoryService.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustmentRequestDTO {

    @NotNull(message = "Input stock ID is required")
    private UUID inputStockId;

    private String transactionType;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Double quantity;

    @NotNull(message = "Performed by is required")
    private UUID performedBy;
}