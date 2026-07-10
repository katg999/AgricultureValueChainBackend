package com.ugaap.ugaap.InventoryService.DTO;

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
public class InventoryItemUpdateDto {

    private String itemName;

    private String category;

    private String unitOfMeasure;

    @Positive(message = "Buying price must be positive")
    private BigDecimal buyingPrice;

    @Positive(message = "Selling price must be positive")
    private BigDecimal sellingPrice;

    @PositiveOrZero(message = "Reorder level must be zero or positive")
    private BigDecimal reorderLevel;
}
