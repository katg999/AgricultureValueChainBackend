package com.ugaap.membership.repository;

import com.ugaap.membership.Entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    List<Role> findAllByTenantId(String tenantId);
    List<Role> findAllByTenantIdIsNull(); // platform-wide roles
    Optional<Role> findByNameAndTenantId(String name, String tenantId);
    boolean existsByNameAndTenantId(String name, String tenantId);
}