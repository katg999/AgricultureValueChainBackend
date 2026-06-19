package com.ugaap.configuration.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class PriceRequest {

    @NotNull
    private UUID gradeId;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal newPrice;

    /**
     * If null or empty → price applies to ALL branches.
     * If populated → price applies only to the listed branches.
     */
    private List<UUID> branchIds;
}