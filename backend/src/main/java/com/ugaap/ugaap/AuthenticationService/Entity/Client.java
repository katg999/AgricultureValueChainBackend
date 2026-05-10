package com.ugaap.ugaap.AuthenticationService.Entity;

import jakarta.persistence.*;
import lombok.*;

import javax.management.relation.Role;
import java.util.UUID;

@Entity
@Table(name = "clients")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private String name;
    private String email;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne
    @JoinColumn(name = "cooperative_id")
    private Cooperative cooperative;

    // --- HIERARCHY LINKS ---

    @ManyToOne
    @JoinColumn(name = "referred_by_id")
    private Client referredBy; // Links Farmer to Field Agent

    @ManyToOne
    @JoinColumn(name = "onboarded_by_id")
    private Client onboardedBy; // Links Farmer to Branch Manager/Coop Admin

    @ManyToOne
    @JoinColumn(name = "managed_by_id")
    private Client managedBy; // Logical reporting line for operational visibility

    // --- STATUS FLAGS ---
    private boolean approvedByAdmin = false;
    private boolean produceSold = false; // Trigger for payroll eligibility
}