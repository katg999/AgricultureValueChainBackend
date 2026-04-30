package com.ugaap.ugaap.Repository;


import com.ugaap.ugaap.Entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;


@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findByRefreshToken(String refreshToken);

    // revoke all active sessions for a client (e.g. password change, suspension)
    @Modifying
    @Transactional
    @Query("""
        UPDATE Session s SET s.status = 'REVOKED'
        WHERE s.client.id = :clientId
        AND s.status = 'ACTIVE'
    """)
    int revokeAllActiveSessionsForClient(UUID clientId);
}