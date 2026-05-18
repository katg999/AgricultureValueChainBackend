package com.ugaap.ugaap.AuthenticationService.Repository;

import com.ugaap.ugaap.AuthenticationService.Entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findByRefreshToken(String refreshToken);

    List<Session> findAllByUserId(UUID userId);

    @Modifying
    @Transactional
    @Query("UPDATE Session s SET s.status = 'REVOKED' " +
            "WHERE s.userId = :userId AND s.status = 'ACTIVE'")
    int revokeAllActiveSessionsForUser(@Param("userId") UUID userId);
}