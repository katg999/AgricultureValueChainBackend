package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "branch_stock_issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchStockIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_item_id", nullable = false)
    private InventoryItem sourceItem;

    // Read-only shadow of the same source_item_id column — lets callers read the id
    // without triggering a lazy-load of sourceItem, which throws EntityNotFoundException
    // if that inventory item has since been deleted (a disbursement record must outlive it).
    @Column(name = "source_item_id", insertable = false, updatable = false)
    private UUID sourceItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_item_id", nullable = false)
    private InventoryItem branchItem;

    @Column(name = "target_branch_id", nullable = false)
    private UUID targetBranchId;

    // Snapshot of the item's descriptive fields at issue time — this record must remain
    // readable even if the underlying inventory item is later deleted or renamed.
    @Column(name = "item_name")
    private String itemName;

    @Column(name = "item_category")
    private String itemCategory;

    @Column(name = "unit_of_measure")
    private String unitOfMeasure;

    @Column(name = "quantity", nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity;

    @Column(name = "total_value", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.ISSUED;

    // Nullable to match InventoryItem.cooperativeId — some sessions' JWTs don't carry
    // a cooperative_id claim, so this can't always be resolved even via the source item.
    @Column(name = "cooperative_id")
    private UUID cooperativeId;

    @Column(name = "issued_by")
    private UUID issuedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
        this.updatedAt = ZonedDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    public enum Status {
        ISSUED, RECEIVED
    }
}
