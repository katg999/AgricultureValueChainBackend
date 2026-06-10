package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryTransaction {
    // Unique transaction identifier
    @Id
    @GeneratedValue
    private UUID id;

    // Reference to input stock being adjusted
    @Column(name = "input_stock_id", nullable = false)
    private UUID inputStockId;

    // Type of transaction: STOCK_IN, STOCK_OUT, ADJUSTMENT, RECOVERY
    @Column(name = "transaction_type", nullable = false, length = 20)
    private String transactionType;

    // Available quantity before transaction
    @Column(name = "previous_balance", nullable = false)
    private Double previousBalance;

    // Available quantity after transaction
    @Column(name = "new_balance", nullable = false)
    private Double newBalance;

    // Quantity changed in this transaction
    @Column(name = "quantity", nullable = false)
    private Double quantity;

    // User who performed the transaction
    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    // Timestamp when transaction was recorded
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}