package com.ugaap.ugaap.CollectionService.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SettlementReceiptDTO {
    private String batchId;
    private int recordsProcessed;
    private String executionStatus; // e.g., "SUCCESS", "PARTIAL_RECOVERY_TRIGGERED"
}