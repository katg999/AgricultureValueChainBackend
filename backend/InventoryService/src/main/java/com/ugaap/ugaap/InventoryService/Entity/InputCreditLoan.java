package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "input_credit_loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InputCreditLoan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "farmer_id", nullable = false)
    private String farmerId;

    @Column(name = "farmer_name")
    private String farmerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "quantity_issued", nullable = false, precision = 19, scale = 4)
    private BigDecimal quantityIssued;

    @Column(name = "total_amount_owed", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmountOwed;

    @Column(name = "amount_paid", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private LoanStatus status = LoanStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "repayment_strategy", nullable = false)
    private RepaymentStrategy repaymentStrategy;

    @Column(name = "custom_deduction_amount", precision = 19, scale = 4)
    private BigDecimal customDeductionAmount;

    @Column(name = "grace_period_ends_at")
    private ZonedDateTime gracePeriodEndsAt;

    @Column(name = "cooperative_id", nullable = false)
    private UUID cooperativeId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

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

    public BigDecimal getRemainingBalance() {
        return totalAmountOwed.subtract(amountPaid);
    }

    public boolean isInGracePeriod() {
        return gracePeriodEndsAt != null && ZonedDateTime.now().isBefore(gracePeriodEndsAt);
    }

    public enum LoanStatus {
        ACTIVE, OVERDUE, PAID
    }

    public enum RepaymentStrategy {
        FULL_DEDUCTION, PARTIAL_DEDUCTION
    }
}
