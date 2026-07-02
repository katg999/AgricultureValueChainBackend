package com.ugaap.configuration.repository;

import com.ugaap.configuration.entity.Commodity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommodityRepository extends JpaRepository<Commodity, UUID> {
    List<Commodity> findAllByActiveTrue();
    Optional<Commodity> findByCode(String code);
    boolean existsByCode(String code);
}