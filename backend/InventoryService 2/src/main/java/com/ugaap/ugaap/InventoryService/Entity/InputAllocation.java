package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "input_allocations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InputAllocation {
    // Unique identifier for the allocation record
    @Id
    @GeneratedValue
    private UUID id;

    // Reference to farmer receiving inputs
    @Column(name = "farmer_id", nullable = false)
    private UUID farmerId;

    // Branch where allocation is processed
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    // Cooperative managing this allocation
    @Column(name = "cooperative_id", nullable = false)
    private UUID cooperativeId;

    // Reference to input stock (derives item name and validates stock availability)
    @Column(name = "input_stock_id", nullable = false)
    private UUID inputStockId;

    // Input item name (derived from InputStock at creation time)
    @Column(nullable = false)
    private String itemName;

    // Quantity allocated to farmer
    @Column(nullable = false)
    private Double quantity;

    // Total monetary value of allocation
    @Column(name = "total_value", nullable = false)
    private Double totalValue;

    // Date when inputs were issued
    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate;

    // Season identifier
    @Column(nullable = false)
    private String season;

    // Terms for input replacement/recovery
    @Column(name = "replacement_terms", columnDefinition = "TEXT")
    private String replacementTerms;

    // Whether farmer has acknowledged receipt
    @Column(name = "farmer_acknowledged", nullable = false)
    @Builder.Default
    private Boolean farmerAcknowledged = false;

    // Date when farmer acknowledged
    @Column(name = "acknowledged_date")
    private LocalDateTime acknowledgedDate;

    // Whether all inputs have been recovered
    @Column(name = "fully_recovered", nullable = false)
    @Builder.Default
    private Boolean fullyRecovered = false;

    // Total quantity recovered so far
    @Column(name = "recovered_quantity")
    @Builder.Default
    private Double recoveredQuantity = 0.0;

    // Record creation timestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}