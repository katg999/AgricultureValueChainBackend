package com.ugaap.ugaap.CollectionService.DTO;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SeasonConfigDTO {
    private Long id;
    private String seasonName;       // e.g., "Main Harvest 2026", "Acreage Cycle B"
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;           // e.g., "ACTIVE", "CLOSED"
}