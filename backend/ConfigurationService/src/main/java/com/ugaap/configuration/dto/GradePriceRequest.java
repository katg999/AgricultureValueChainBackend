package com.ugaap.configuration.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class GradePriceRequest {

    @NotNull
    private UUID commodityId;

    @NotNull
    private UUID gradeId;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal pricePerKg;

    @NotBlank
    private String branchName;
}