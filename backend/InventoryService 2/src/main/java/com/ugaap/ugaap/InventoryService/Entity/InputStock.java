package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

// Input stock represents actual inventory of agricultural inputs (fertilizer, seeds, chemicals)
// Each record tracks quantity received and available for issuance
@Entity
@Table(name = "input_stock")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InputStock {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "input_item_id", nullable = false)
    private UUID inputItemId;

    // Name of the item (copied from InputItem for performance)
    @Column(nullable = false)
    private String itemName;

    // Short code for easy reference (auto-generated)
    @Column(name = "short_code")
    private String shortCode;

    @Column(name = "co_id", nullable = false)
    private UUID cooperativeId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    // Supplier who provided this stock
    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    // Total quantity received from supplier
    @Column(nullable = false)
    private Double quantity;

    // Cost per unit of the input
    @Column(nullable = false)
    private Double unitCost;

    // Total monetary value (quantity * unitCost) - auto-calculated
    @Column(name = "total_value", nullable = false)
    private Double totalValue;

    // Minimum threshold for low stock alerts
    @Column(name = "min_threshold")
    private Double minimumThreshold;

    // When this stock was received
    @Column(name = "received_date")
    private LocalDateTime receivedDate;

    // Current available quantity (reduced as inputs are issued)
    @Column(name = "available_quantity", nullable = false)
    private Double availableQuantity;

    // Record creation timestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Auto-generate short code, auto-calculate total value and total price on persist
    @PrePersist
    @PreUpdate
    protected void onSave() {
        // Auto-generate short code if not provided
        if (shortCode == null || shortCode.isEmpty()) {
            shortCode = generateShortCode();
        }
        // Auto-calculate total value if quantity or unit cost changes
        if (totalValue == null && quantity != null && unitCost != null) {
            totalValue = quantity * unitCost;
        }
        // Set timestamps
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (receivedDate == null) {
            receivedDate = LocalDateTime.now();
        }
    }

    // Generate a short 8-character alphanumeric code for easy reference
    private String generateShortCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            int idx = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(idx));
        }
        return sb.toString();
    }
}