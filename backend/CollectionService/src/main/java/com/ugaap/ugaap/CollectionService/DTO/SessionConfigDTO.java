package com.ugaap.ugaap.CollectionService.DTO;

import lombok.Data;

@Data
public class SessionConfigDTO {
    private String id;        // "morning" | "midday" | "afternoon"
    private String label;     // e.g. "Morning"
    private int startHour;    // 0-23
    private int endHour;      // 0-23
}