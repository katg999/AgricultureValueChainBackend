package com.ugaap.configuration.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PriceResponse {
    private UUID       id;
    private String     commodityName;
    private String     commodityCode;
    private String     gradeName;    // null for flat prices
    private String     gradeCode;    // null for flat prices
    private String     branchName;
    private BigDecimal currentPrice;
    private BigDecimal newPrice;
    private BigDecimal changePercent;
}