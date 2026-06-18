package com.ugaap.ugaap.CollectionService.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/**
 * Local persistent cache for Farmer profiles within the Collection Service context.
 * Relies on a unique UUID as its principal structural identifier.
 */
@Entity
@Table(name = "farmers_cache")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Farmer {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "full_name")
    private String name;

    @Column(name = "short_code", nullable = false, unique = true)
    private String shortCode;
}