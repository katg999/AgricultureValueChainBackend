package com.ugaap.authentication.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_client_id", columnList = "client_id"),
        @Index(name = "idx_audit_event_type", columnList = "event_type"),
        @Index(name = "idx_audit_created_at", columnList = "created_at")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // nullable — failed logins may not have a resolved client
    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "email")
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "success", nullable = false)
    private boolean success;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;      // JSON blob for extra context

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ── enum ──────────────────────────────────────────────────

    public enum EventType {
        LOGIN,
        LOGOUT,
        LOGIN_FAILED,
        TOKEN_REFRESHED,
        TOKEN_REVOKED,
        ACCOUNT_LOCKED,
        PASSWORD_CHANGED,
        SESSION_EXPIRED,
        REGISTRATION
    }
}