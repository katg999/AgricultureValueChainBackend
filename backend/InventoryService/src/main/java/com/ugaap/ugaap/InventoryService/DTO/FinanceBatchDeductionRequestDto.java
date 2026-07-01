package com.ugaap.ugaap.InventoryService.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceBatchDeductionRequestDto {

    @NotBlank(message = "batchId is required for idempotency")
    private String batchId;

    @NotEmpty(message = "At least one deduction record is required")
    private List<FarmerDeductionRecord> deductionRecords;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmerDeductionRecord {
        private String farmerId;
        private BigDecimal deductionAmount;
    }
}
