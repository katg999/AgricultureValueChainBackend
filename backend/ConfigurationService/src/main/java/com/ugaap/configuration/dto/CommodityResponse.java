package com.ugaap.configuration.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CommodityResponse {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private boolean active;
}