package com.ugaap.ugaap.InventoryService.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InputAllocationResponseDTO {

    private UUID id;
    private UUID farmerId;
    private String farmerName;
    private UUID branchId;
    private String branchName;
    private UUID cooperativeId;
    private UUID inputStockId;
    private String itemName;
    private Double quantity;
    private Double totalValue;
    private String season;
    private String replacementTerms;
    private Boolean farmerAcknowledged;
    private LocalDateTime acknowledgedDate;
    private LocalDateTime issueDate;
    private Boolean fullyRecovered;
    private Double recoveredQuantity;
    private LocalDateTime createdAt;
}