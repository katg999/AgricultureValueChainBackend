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
public class BatchDeductionRequestDto {

    @NotBlank(message = "batchId is required for idempotency")
    private String batchId;

    @NotEmpty(message = "At least one payout record is required")
    private List<FarmerPayoutRecord> payoutRecords;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmerPayoutRecord {
        private String farmerId;
        private BigDecimal grossPayout;
    }
}
