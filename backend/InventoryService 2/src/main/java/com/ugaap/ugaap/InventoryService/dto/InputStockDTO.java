package com.ugaap.ugaap.InventoryService.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InputStockDTO {

    // Short code for easy reference (auto-generated if not provided)
    private String shortCode;
    
    private UUID inputItemId;
    private String itemName;
    private UUID cooperativeId;
    private UUID branchId;
    private String supplierName;
    private Double quantity;
    private Double unitCost;
    private Double minimumThreshold;
    private LocalDateTime receivedDate;
}