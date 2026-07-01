package com.ugaap.ugaap.InventoryService.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentDto {

    @NotNull(message = "Delta is required")
    private BigDecimal delta;

    @NotBlank(message = "Reason is required")
    private String reason;
}
