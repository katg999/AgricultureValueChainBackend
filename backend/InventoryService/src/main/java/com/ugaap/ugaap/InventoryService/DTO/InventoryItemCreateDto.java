package com.ugaap.ugaap.InventoryService.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemCreateDto {

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Item name is required")
    private String itemName;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Unit of measure is required")
    private String unitOfMeasure;

    @NotNull(message = "Buying price is required")
    @Positive(message = "Buying price must be positive")
    private BigDecimal buyingPrice;

    @NotNull(message = "Selling price is required")
    @Positive(message = "Selling price must be positive")
    private BigDecimal sellingPrice;

    @NotNull(message = "Reorder level is required")
    @PositiveOrZero(message = "Reorder level must be zero or positive")
    private BigDecimal reorderLevel;

    @PositiveOrZero(message = "Initial quantity must be zero or positive")
    private BigDecimal initialQuantity;
}
