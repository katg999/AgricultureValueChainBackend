package com.ugaap.ugaap.InventoryService.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InputAllocationDTO {
    // Farmer receiving the input allocation - either farmerId or farmerName can be used
    private UUID farmerId;
    private String farmerName;
    // Branch where allocation is processed - either branchId or branchName can be used
    private UUID branchId;
    private String branchName;
    // Cooperative managing the allocation
    private UUID cooperativeId;
    // Reference to input stock record - either inputStockId or itemName can be used
    // Using itemName will auto-find the stock record
    private UUID inputStockId;
    private String itemName;
    // Quantity to issue (validated against available stock)
    private Double quantity;
    // Total monetary value of this allocation - auto-calculated if not provided
    private Double totalValue;
    // Season identifier for the allocation
    private String season;
    // Terms for input replacement/recovery
    private String replacementTerms;
}