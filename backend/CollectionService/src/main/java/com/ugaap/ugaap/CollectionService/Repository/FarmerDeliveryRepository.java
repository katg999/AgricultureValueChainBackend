package com.ugaap.ugaap.CollectionService.Repository;

import com.ugaap.ugaap.CollectionService.Entity.FarmerDelivery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;


/**
 * Data access layer managing persistent delivery and loan adjustment models.
 */
@Repository
public interface FarmerDeliveryRepository extends JpaRepository<FarmerDelivery, UUID>, JpaSpecificationExecutor<FarmerDelivery> {

    List<FarmerDelivery> findByFarmerId(String farmerId); // UUID → String

    List<FarmerDelivery> findByFarmerIdIn(Collection<String> farmerIds); // Collection<UUID> → Collection<String>

    List<FarmerDelivery> findByFarmerNameContainingIgnoreCase(String farmerName);

    class FarmerDeliverySpecifications {
        public static Specification<FarmerDelivery> withFilters(String farmerName, String season, String status) {
            return (root, query, cb) -> {
                List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

                if (farmerName != null && !farmerName.isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("farmerName")), "%" + farmerName.toLowerCase() + "%"));
                }
                if (season != null && !season.isEmpty()) {
                    predicates.add(cb.equal(root.get("season"), season));
                }
                if (status != null && !status.isEmpty()) {
                    predicates.add(cb.equal(root.get("status"), status));
                }
                return cb.and();
            };
        }
    }
}