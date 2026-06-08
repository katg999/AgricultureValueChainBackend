package com.ugaap.authentication.Repository;

import com.ugaap.authentication.Entity.Credentials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CredentialsRepository extends JpaRepository<Credentials, UUID> {
    Optional<Credentials> findByUsername(String username);
    Optional<Credentials> findByEmail(String email);
    Optional<Credentials> findByUsernameOrEmail(String username, String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}