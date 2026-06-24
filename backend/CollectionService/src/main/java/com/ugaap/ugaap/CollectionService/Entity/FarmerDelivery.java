package com.ugaap.ugaap.CollectionService.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.util.UUID;

/**
 * Main transactional ledger tracking physical crop intake volumes.
 * Updated to capture branch routing and remove strict structural constraints.
 */
@Entity
@Table(name = "farmer_deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO) // Changed from IDENTITY to AUTO for UUID consistency if needed, or keep standard setup
    private UUID id; // Fixed: Changed from Long to UUID to match repository search lookup methods safely

    @Column(name = "branch", nullable = false)
    private String branch; // Added: Tracks physical operating branches (e.g., "BR-MBL")

    @Column(name = "farmer_id")
    private String farmerId; // Modified: Nullable now since ID isn't entered directly on the form payload

    @Column(name = "farmer_name", nullable = false)
    private String farmerName;

    @Column(name = "commodity", nullable = false)
    private String commodity;

    @Column(name = "unit_of_measure", nullable = false)
    private String unitOfMeasure;

    @Column(name = "quantity_delivered", nullable = false)
    private Double quantityDelivered; // Maps directly to UI "Volume" numerical tracking value

    @Column(name = "estimated_delivery_value", nullable = false)
    private Double estimatedDeliveryValue; // Maps directly to UI "Estimated Value (UGX)" numerical tracking value

    @Column(name = "total_value", nullable = false)
    private Double totalValue;


    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "delivery_date", nullable = false)
    private Date deliveryDate;

    @Column(name = "season", nullable = false)
    private String season;

    @Column(name = "status", nullable = false)
    private String status; // e.g., "Pending", "Approved"

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;
    private int inputValueUgx;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        if (this.deliveryDate == null) {
            this.deliveryDate = new Date();
        }
    }

    public Object getInputAllocationId() {
        return null;
    }

}