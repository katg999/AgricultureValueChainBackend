package com.ugaap.configuration.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(schema = "config", name = "branch_prices",
        uniqueConstraints = @UniqueConstraint(columnNames = {"grade_id", "branch_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id", nullable = false)
    private Grade grade;

    // null means price applies to ALL branches
    @Column(name = "branch_id")
    private UUID branchId;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal currentPrice = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal newPrice;

    @Column(precision = 5, scale = 2)
    private BigDecimal changePercent;   // computed on save

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}