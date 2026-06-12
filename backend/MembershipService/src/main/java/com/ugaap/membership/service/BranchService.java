package com.ugaap.membership.service;

import com.ugaap.membership.Entity.Branch;
import com.ugaap.membership.Entity.Cooperative;
import com.ugaap.membership.dto.BranchDto;
import com.ugaap.membership.repository.BranchRepository;
import com.ugaap.membership.repository.CooperativeRepository;
import com.ugaap.shared.Exception.AuthException; //look here when fixing these errors
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final CooperativeRepository cooperativeRepository;

    @Transactional
    public BranchDto.Response createBranch(
            BranchDto.CreateRequest request,
            String createdBy) {

        Cooperative cooperative = cooperativeRepository
                .findByTenantId(request.getTenantId())
                .orElseThrow(() -> new AuthException(
                        "Cooperative not found for tenantId: "
                                + request.getTenantId()));

        String branchCode = request.getBranchCode() != null
                ? request.getBranchCode().toUpperCase()
                : (request.getTenantId() + "-"
                   + request.getName().replaceAll("\\s+", "-")
        ).toUpperCase();

        Branch branch = Branch.builder()
                .cooperative(cooperative)
                .tenantId(request.getTenantId())
                .name(request.getName())
                .location(request.getLocation())
                .branchCode(branchCode)
                .status(Branch.BranchStatus.ACTIVE)
                .build();

        branchRepository.save(branch);
        log.info("Branch created: {} for tenantId={}", branchCode,
                request.getTenantId());

        return mapToResponse(branch);
    }

    public List<BranchDto.Response> listBranches(String tenantId) {
        return branchRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public BranchDto.Response getBranch(String branchId) {
        Branch branch = branchRepository.findById(UUID.fromString(branchId))
                .orElseThrow(() -> new AuthException(
                        "Branch not found: " + branchId));
        return mapToResponse(branch);
    }

    private BranchDto.Response mapToResponse(Branch branch) {
        return BranchDto.Response.builder()
                .branchId(branch.getBranchId().toString())
                .name(branch.getName())
                .tenantId(branch.getTenantId())
                .location(branch.getLocation())
                .branchCode(branch.getBranchCode())
                .status(branch.getStatus().name())
                .createdAt(branch.getCreatedAt() != null
                        ? branch.getCreatedAt().toString() : null)
                .build();
    }
}