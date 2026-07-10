package com.ugaap.ugaap.InventoryService.DTO;

import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.LoanStatus;
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
public class InputCreditSummaryDto {

    private String farmerId;
    private String farmerName;
    private BigDecimal totalOwed;
    private BigDecimal totalPaid;
    private BigDecimal remainingBalance;
    private List<LoanSummaryEntry> loans;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoanSummaryEntry {
        private String loanId;
        private String itemName;
        private BigDecimal totalAmountOwed;
        private BigDecimal amountPaid;
        private BigDecimal remainingBalance;
        private LoanStatus status;
        private boolean inGracePeriod;
    }
}
