package com.ugaap.ugaap.InventoryService.DTO;

import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.LoanStatus;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.RepaymentStrategy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InputCreditDto {

    private UUID id;
    private String farmerId;
    private String farmerName;
    private String itemSku;
    private String itemName;
    private BigDecimal quantityIssued;
    private BigDecimal totalAmountOwed;
    private BigDecimal amountPaid;
    private BigDecimal remainingBalance;
    private LoanStatus status;
    private RepaymentStrategy repaymentStrategy;
    private BigDecimal customDeductionAmount;
    private ZonedDateTime gracePeriodEndsAt;
    private boolean inGracePeriod;
    private UUID branchId;
    private ZonedDateTime createdAt;
}
