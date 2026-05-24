package com.ugaap.ugaap.MembershipService.service;

import com.ugaap.ugaap.MembershipService.dto.CooperativeDto;
import com.ugaap.ugaap.MembershipService.Entity.Cooperative;
import com.ugaap.ugaap.MembershipService.Entity.Branch;
import com.ugaap.ugaap.MembershipService.repository.BranchRepository;
import com.ugaap.ugaap.MembershipService.repository.CooperativeRepository;
import com.ugaap.ugaap.shared.security.RlsContextApplier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CooperativeService {

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+");

    private final CooperativeRepository cooperativeRepository;
    private final BranchRepository branchRepository;
    private final RlsContextApplier rlsContextApplier;

    @Transactional
    public CooperativeDto.CreateResponse onboardCooperative(
            CooperativeDto.CreateRequest request,
            String performedBy) {

        // 1. Uniqueness guard
        if (cooperativeRepository.existsByRegistrationNumber(
                request.getRegistrationNumber())) {
            throw new IllegalArgumentException(
                    "Cooperative with registration number '"
                            + request.getRegistrationNumber() + "' already exists");
        }

        // 2. Derive tenant_id slug
        String tenantId = deriveTenantId(request.getName());
        if (cooperativeRepository.existsByTenantId(tenantId)) {
            tenantId = tenantId + "-" + System.currentTimeMillis();
        }

        // 3. Persist Cooperative
        Cooperative cooperative = Cooperative.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .registrationNumber(request.getRegistrationNumber())
                .address(request.getAddress())
                .contactPersonName(request.getContactPersonName())
                .contactPersonPhone(request.getContactPersonPhone())
                .contactPersonEmail(request.getContactPersonEmail())
                .poBox(request.getPoBox())
                .websiteUrl(request.getWebsiteUrl())
                .country(request.getCountry())
                .status(Cooperative.CooperativeStatus.ACTIVE)
                .schemaNsNamespace(tenantId)
                .createdBy(performedBy)
                .build();

        cooperative = cooperativeRepository.save(cooperative);
        log.info("Cooperative created: tenantId={}, name={}",
                tenantId, cooperative.getName());

        // 4. Create default HQ branch
        String branchCode = (tenantId + "-HQ").toUpperCase();
        Branch defaultBranch = Branch.builder()
                .cooperative(cooperative)
                .tenantId(tenantId)
                .name(request.getDefaultBranchName())
                .location(request.getDefaultBranchLocation())
                .branchCode(branchCode)
                .status(Branch.BranchStatus.ACTIVE)
                .build();

        defaultBranch = branchRepository.save(defaultBranch);
        log.info("Default branch created: branchCode={}", branchCode);

        return CooperativeDto.CreateResponse.builder()
                .tenantId(tenantId)
                .cooperativeId(cooperative.getCooperativeId().toString())
                .defaultBranchId(defaultBranch.getBranchId().toString())
                .defaultBranchCode(branchCode)
                .message("Cooperative onboarded successfully. " +
                        "Create admin roles and users via Access Management.")
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────

    private String deriveTenantId(String name) {
        String normalised = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
        return NON_ALPHANUMERIC.matcher(normalised).replaceAll("-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    public List<CooperativeDto.Response> listCooperatives() {
        return cooperativeRepository.findAll()
                .stream()
                .map(c -> {
                    CooperativeDto.Response response = new CooperativeDto.Response();
                    response.setCooperativeId(c.getCooperativeId().toString());
                    response.setTenantId(c.getTenantId());
                    response.setName(c.getName());
                    response.setRegistrationNumber(c.getRegistrationNumber());
                    response.setAddress(c.getAddress());
                    response.setContactPersonName(c.getContactPersonName());
                    response.setContactPersonPhone(c.getContactPersonPhone());
                    response.setContactPersonEmail(c.getContactPersonEmail());
                    response.setStatus(c.getStatus().name());
                    response.setCreatedAt(c.getCreatedAt().toString());
                    return response;
                })
                .toList();
    }

}