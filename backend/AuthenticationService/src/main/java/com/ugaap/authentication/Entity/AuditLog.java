package com.ugaap.authentication.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", schema = "public")  // ← fix schema
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ── NOT NULL columns ──────────────────────────────────────
    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "success", nullable = false)
    private boolean success;

    // ── NULLABLE columns ──────────────────────────────────────
    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "email")
    private String email;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "metadata")
    private String metadata;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "changes")
    private String changes;

    public enum EventType {
        LOGIN, LOGOUT, LOGIN_FAILED, REGISTRATION,
        TOKEN_REFRESHED, ACCOUNT_LOCKED, PASSWORD_CHANGED
    }
}