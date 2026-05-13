package com.ugaap.ugaap.Membership.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "cooperatives")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cooperative {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    private String registrationNumber;
}