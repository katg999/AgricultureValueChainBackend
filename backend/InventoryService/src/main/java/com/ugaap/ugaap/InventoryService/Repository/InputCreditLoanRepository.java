package com.ugaap.ugaap.InventoryService.Repository;

import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan;
import com.ugaap.ugaap.InventoryService.Entity.InputCreditLoan.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InputCreditLoanRepository extends JpaRepository<InputCreditLoan, UUID>, JpaSpecificationExecutor<InputCreditLoan> {

    List<InputCreditLoan> findByFarmerIdAndBranchId(String farmerId, UUID branchId);

    List<InputCreditLoan> findByBranchIdAndStatus(UUID branchId, LoanStatus status);

    List<InputCreditLoan> findByFarmerIdInAndStatusIn(List<String> farmerIds, List<LoanStatus> statuses);

    List<InputCreditLoan> findByFarmerId(String farmerId);
}
