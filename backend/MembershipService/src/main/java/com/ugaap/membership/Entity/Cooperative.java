package com.ugaap.membership.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cooperatives", schema = "membership")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cooperative {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        @Column(name = "cooperative_id", updatable = false, nullable = false)
        private UUID cooperativeId;

        @Column(name = "tenant_id", unique = true, nullable = false)
        private String tenantId;

        @Column(name = "name", nullable = false)
        private String name;

        @Column(name = "registration_number", unique = true, nullable = false)
        private String registrationNumber;

        @Column(name = "address", nullable = false)
        private String address;

        @Column(name = "account_name", nullable = false)
        private String accountName;

        @Column(name = "account_number")
        private String accountNumber;

        @Column(name = "bank_branch")
        private String bankBranch;

        @Column(name = "po_box")
        private String poBox;

        @Column(name = "website_url")
        private String websiteUrl;

        @Column(name = "country")
        private String country;

        @Enumerated(EnumType.STRING)
        @Column(name = "status", nullable = false)
        private CooperativeStatus status;

        @Column(name = "schema_namespace", unique = true)
        private String schemaNsNamespace;

        @CreationTimestamp
        @Column(name = "created_at", updatable = false)
        private LocalDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @Column(name = "created_by")
        private String createdBy;

        public enum CooperativeStatus {
                PENDING, ACTIVE, SUSPENDED, DEACTIVATED
        }
}
