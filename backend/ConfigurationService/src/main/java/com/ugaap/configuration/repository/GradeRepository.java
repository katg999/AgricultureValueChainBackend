package com.ugaap.configuration.repository;

import com.ugaap.configuration.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GradeRepository extends JpaRepository<Grade, UUID> {
    List<Grade> findAllByActiveTrue();
    Optional<Grade> findByCode(String code);
    boolean existsByCode(String code);
}