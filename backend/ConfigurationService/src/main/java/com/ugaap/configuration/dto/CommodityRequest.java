package com.ugaap.configuration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommodityRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String code;

    private String description;
}