package com.ugaap.ugaap.InventoryService.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InputDeliveryPerformanceDTO {
    private String itemName;
    private Long totalAllocation;
    private Long fullyRecovered;
    private Long partiallyRecovered;
    private Long overdue;
    private Long pendingAck;
    private Double recoveryRate;
    private Double ackRate;
}