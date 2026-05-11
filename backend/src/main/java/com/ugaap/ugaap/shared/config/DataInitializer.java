package com.ugaap.ugaap.shared.config;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.management.relation.Role;
import java.security.Permission;
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
    public void run(String @NonNull ... args) {
        // Define Granular Actions across Membership and Config modules
        Set<Permission> allPerms = Stream.of(
                        "MEMBERSHIP_VIEW", "MEMBERSHIP_CREATE", "MEMBERSHIP_EDIT", "MEMBERSHIP_DELETE", "MEMBERSHIP_APPROVE",
                        "MEMBERSHIP_REFER", "CONFIG_VIEW", "CONFIG_EDIT"
                ).map(name -> permissionRepository.findByName(name)
                        .orElseGet(() -> permissionRepository.save(new Permission(name) {
                            /**
                             * @param permission the permission to check against.
                             * @return
                             */
                            @Override
                            public boolean implies(Permission permission) {
                                return false;
                            }

                            /**
                             * @param obj the object we are testing for equality with this object.
                             * @return
                             */
                            @Override
                            public boolean equals(Object obj) {
                                return false;
                            }

                            /**
                             * @return
                             */
                            @Override
                            public int hashCode() {
                                return 0;
                            }

                            /**
                             * @return
                             */
                            @Override
                            public String getActions() {
                                return "";
                            }
                        })))
                .collect(Collectors.toSet());

        // PLATFORM_ADMIN: Full System Access
        seedRole("PLATFORM_ADMIN", allPerms);

        // COOP_ADMIN: Sacco-level owner
        seedRole("COOP_ADMIN", filter(allPerms,
                "MEMBERSHIP_VIEW", "MEMBERSHIP_CREATE", "MEMBERSHIP_EDIT", "MEMBERSHIP_APPROVE", "CONFIG_EDIT"));

        // BRANCH_MANAGER: Can View/Edit/Onboard but NOT Approve or Delete
        seedRole("BRANCH_MANAGER", filter(allPerms,
                "MEMBERSHIP_VIEW", "MEMBERSHIP_CREATE", "MEMBERSHIP_EDIT"));

        // FIELD_AGENT: Can only Refer and View
        seedRole("FIELD_AGENT", filter(allPerms, "MEMBERSHIP_VIEW", "MEMBERSHIP_REFER"));
    }

    private void seedRole(String name, Set<Permission> p) {
        Role r = roleRepository.findByName(name).orElse(new Role(name));
        r.setPermissions(p);
        roleRepository.save(r);
    }

    private Set<Permission> filter(Set<Permission> p, String... names) {
        Set<String> targets = Set.of(names);
        return p.stream().filter(x -> targets.contains(x.getName())).collect(Collectors.toSet());
    }
}