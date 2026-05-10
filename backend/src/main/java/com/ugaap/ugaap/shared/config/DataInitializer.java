package com.ugaap.ugaap.config;

import com.ugaap.ugaap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Defined Granular Permissions
        Set<Permission> allPerms = Stream.of(
                // 1. SEED PERMISSIONS
                // We define granular actions for each step of the farmer lifecycle
                Set < Permission > allPerms = Stream.of(
                                "FARMER_REFER",      // Field Agent: mobile lead generation
                                "FARMER_ONBOARD",    // Branch/Admin: KYC and Profile creation
                                "FARMER_APPROVE",    // Coop Admin: Verification gate
                                "AGENT_MANAGE",      // Coop Admin: Assign agents to branches
                                "PAYMENT_TRIGGER",   // Coop Admin: Final batch payroll
                                "PRODUCE_RECORD",    // Field Agent: Daily delivery weights
                                "DEDUCTION_MANUAL"   // Coop Admin: Seedling/Fertilizer credit recovery
                        ).map(name -> permissionRepository.findByName(name)
                                .orElseGet(() -> permissionRepository.save(new Permission(name))))
                        .collect(Collectors.toSet());

        // 2. Seed Roles based on Hierarchy

        // PLATFORM_ADMIN: Oversees the entire system and onboards Coops.
        seedRole("PLATFORM_ADMIN", allPerms);

        // COOP_ADMIN: High-level management of their specific Sacco. Can Onboard AND Approve.
        seedRole("COOP_ADMIN", filter(allPerms, "BRANCH_MANAGE", "FARMER_ONBOARD", "FARMER_APPROVE", "AGENT_MANAGE", "AGENT_ONBOARD", "FARMER_APPROVE", "PAYMENT_TRIGGER", "MANUAL_DEDUCTION"));

        // BRANCH_MANAGER: Regional supervisor.
        seedRole("BRANCH_MANAGER", filter(allPerms, "FARMER_ONBOARD", "AGENT_VIEW", "FARMER_VIEW", "PRODUCE_VERIFY"));

        // AGENT: Field-level operators. can only refer and record produce.
        seedRole("AGENT", filter(allPerms, "PRODUCE_RECORD"));

        // FARMER: Limited access (likely just viewing their own sales/payments).
        seedRole("FARMER", filter(allPerms, "PRODUCE_RECORD"));
    }

    /**
     * Helper to map specific strings to existing Permission entities
     */
    private Set<Permission> filter(Set<Permission> perms, String... names) {
        Set<String> targetNames = Set.of(names);
        return perms.stream()
                .filter(p -> targetNames.contains(p.getName()))
                .collect(Collectors.toSet());
    }

    /**
     * Persists the Role if it doesn't exist, updating permissions regardless.
     */
    private void seedRole(String name, Set<Permission> permissions) {
        Role role = roleRepository.findByName(name).orElseGet(() -> new Role(name));
        role.setPermissions(permissions);
        roleRepository.save(role);
    }
}
}