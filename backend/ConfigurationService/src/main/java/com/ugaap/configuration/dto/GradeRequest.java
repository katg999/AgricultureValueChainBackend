package com.ugaap.configuration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GradeRequest {
    @NotBlank
    private String name;

    @NotBlank
    @Size(max = 10)
    private String code;

    private String description;
}