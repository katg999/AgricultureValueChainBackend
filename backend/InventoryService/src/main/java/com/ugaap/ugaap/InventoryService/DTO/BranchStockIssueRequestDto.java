package com.ugaap.ugaap.InventoryService.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchStockIssueRequestDto {

    @NotNull(message = "Stock item ID is required")
    private UUID stockItemId;

    @NotNull(message = "Branch ID is required")
    private UUID branchId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    private String season;
}
