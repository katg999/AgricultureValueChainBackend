package com.ugaap.ugaap.MembershipService.repository;

import com.ugaap.ugaap.MembershipService.Entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByModuleAndAction(
            Permission.Module module,
            Permission.Action action
    );
}