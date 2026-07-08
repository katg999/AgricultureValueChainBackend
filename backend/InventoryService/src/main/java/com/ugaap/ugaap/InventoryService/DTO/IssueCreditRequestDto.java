package com.ugaap.ugaap.InventoryService.DTO;

import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.RepaymentStrategy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueCreditRequestDto {

    @NotBlank(message = "Farmer ID is required")
    private String farmerId;

    private String farmerName;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotNull(message = "Repayment strategy is required")
    private RepaymentStrategy repaymentStrategy;

    private BigDecimal customDeductionAmount;

    private ZonedDateTime gracePeriodEndsAt;
}
