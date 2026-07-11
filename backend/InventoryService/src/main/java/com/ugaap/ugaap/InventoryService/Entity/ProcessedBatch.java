package com.ugaap.ugaap.InventoryService.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Entity
@Table(name = "processed_payment_batches")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessedBatch {

    @Id
    @Column(name = "batch_id", nullable = false, updatable = false)
    private String batchId;

    @Column(name = "processed_at", nullable = false, updatable = false)
    private ZonedDateTime processedAt;
}
