package com.ugaap.ugaap.InventoryService.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InputStockResponseDTO {

    // Short code for easy reference (auto-generated)
    private String shortCode;
    
    private UUID id;
    private UUID inputItemId;
    private String itemName;
    private UUID cooperativeId;
    private UUID branchId;
    private String supplierName;
    private Double quantity;
    private Double unitCost;
    private Double totalValue;
    private Double minimumThreshold;
    private Double availableQuantity;
    private LocalDateTime receivedDate;
    private LocalDateTime createdAt;
}