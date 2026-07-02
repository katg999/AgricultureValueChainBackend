package com.ugaap.membership.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "permissions",
        schema = "membership",
        uniqueConstraints = @UniqueConstraint(columnNames = {"module", "action"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "permission_id", updatable = false, nullable = false)
    private UUID permissionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "module", nullable = false)
    private Module module;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private Action action;

    @Column(name = "description")
    private String description;

    public enum Module {BRANCHES, ORGANISATION_SETUP, CONFIGURATION, COLLECTIONS, FARMERS,AGENTS, COLLECTION_HUBS,  INVENTORY, FINANCE, USER_MANAGEMENT, ROLES_AND_PERMISSIONS, REPORTS
    }

    public enum Action {
        VIEW, CREATE, EDIT, APPROVE, DELETE
    }
}