package com.ugaap.configuration.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PriceResponse {
    private UUID       id;
    private String     gradeName;
    private String     gradeCode;
    private UUID       branchId;       // null = global
    private BigDecimal currentPrice;
    private BigDecimal newPrice;
    private BigDecimal changePercent;
}