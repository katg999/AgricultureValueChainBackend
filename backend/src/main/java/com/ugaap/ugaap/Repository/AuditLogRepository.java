package com.ugaap.ugaap.Repository;

// AuditLogRepository.java
import com.ugaap.ugaap.Entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByClientIdOrderByCreatedAtDesc(UUID clientId, Pageable pageable);

    long countByEmailAndEventTypeAndCreatedAtAfter(
            String email,
            AuditLog.EventType eventType,
            LocalDateTime after
    );
}