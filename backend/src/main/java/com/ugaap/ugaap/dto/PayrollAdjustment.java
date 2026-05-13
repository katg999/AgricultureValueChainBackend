package com.ugaap.ugaap.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PayrollAdjustment {
    private UUID farmerId;
    private double grossValue;
    private double manualDeduction;
}