package com.ugaap.ugaap.InventoryService.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDto {

    private UUID id;
    private String sku;
    private String itemName;
    private String category;
    private String unitOfMeasure;
    private BigDecimal buyingPrice;
    private BigDecimal sellingPrice;
    private BigDecimal quantityAvailable;
    private BigDecimal reorderLevel;
    private boolean lowStock;
    private UUID branchId;
    private UUID cooperativeId;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
