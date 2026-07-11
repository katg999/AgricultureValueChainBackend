package com.ugaap.ugaap.InventoryService.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Field names mirror the frontend's BranchDisbursement interface exactly —
 * the frontend pipes this response straight through with no field mapping.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDisbursementDto {

    private UUID id;
    private UUID stockItemId;
    private UUID branchId;
    private String branchName;
    private String itemName;
    private String itemType;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal totalValue;
    private String issueDate;
    private String status;
}
