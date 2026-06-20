package com.ugaap.ugaap.CollectionService.Entity; // Adjust to your actual package structure

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "season_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeasonConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cooperative_id", nullable = false)
    private String cooperativeId;

    @Column(name = "season_name", nullable = false)
    private String seasonName; // e.g., "Main Maize Harvest 2026"

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String status; // e.g., "ACTIVE", "CLOSED", "UPCOMING"
}