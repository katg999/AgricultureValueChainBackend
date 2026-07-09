package com.ugaap.ugaap.InventoryService.DTO;

import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.LoanStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanStatusUpdateDto {

    @NotNull(message = "Status is required")
    private LoanStatus status;

    @NotBlank(message = "Reason is required")
    private String reason;
}
