package com.ugaap.membership.service;

import com.ugaap.membership.dto.CooperativeDto;
import com.ugaap.membership.Entity.Cooperative;
import com.ugaap.membership.repository.BranchRepository;
import com.ugaap.membership.repository.CooperativeRepository;
import com.ugaap.shared.security.RlsContextApplier;
import lombok.RequiredArgsConstructor;
import com.ugaap.membership.Entity.Branch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ugaap.membership.Entity.Role;
import com.ugaap.membership.repository.RoleRepository;
import com.ugaap.membership.dto.AccessManagementDto;
import com.ugaap.shared.util.MinioService;
import org.springframework.web.multipart.MultipartFile;

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
    private final RoleRepository roleRepository;
    private final UserService userService;
    private final MinioService minioService;


    @Transactional
    public CooperativeDto.CreateResponse onboardCooperative(
            CooperativeDto.CreateRequest request,
            MultipartFile adminPhoto,              // ← ADD
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
        final String finalTenantId = tenantId;

        // 3. Persist Cooperative
        Cooperative cooperative = Cooperative.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .registrationNumber(request.getRegistrationNumber())
                .address(request.getAddress())
                .accountName(request.getAccountName())
                .accountNumber(request.getAccountNumber())
                .bankBranch(request.getBankBranch())
                .poBox(request.getPoBox())
                .websiteUrl(request.getWebsiteUrl())
                .country(request.getCountry())
                .status(Cooperative.CooperativeStatus.ACTIVE)
                .schemaNsNamespace(tenantId)
                .createdBy(performedBy)
                .build();

        cooperative = cooperativeRepository.save(cooperative);
        log.info("Cooperative created: tenantId={}, name={}", tenantId, cooperative.getName());

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

        // 5. Seed MAKER and CHECKER roles for this tenant
        seedAdminRoles(tenantId);
        log.info("Admin roles seeded for tenantId={}", tenantId);

        // 6. Create the Cooperative Admin (Maker) user — provisions
        //    credentials + emails them via AuthenticationService/SendGrid
        var makerRole = roleRepository
                .findByNameAndTenantId("COOPERATIVE_ADMIN_MAKER", tenantId)
                .orElseThrow(() -> new IllegalStateException(
                        "COOPERATIVE_ADMIN_MAKER role missing right after seeding for tenant: "
                                + finalTenantId));   // ← use finalTenantId here

        AccessManagementDto.UserResponse adminUser = userService.createUser(
                AccessManagementDto.CreateUserRequest.builder()
                        .fullName(request.getAdminFullName())
                        .email(request.getAdminEmail())
                        .phone(request.getAdminPhone())
                        .tenantId(tenantId)
                        .roleId(makerRole.getRoleId())
                        .dateOfBirth(request.getAdminDateOfBirth())
                        .nationalId(request.getAdminNationalId())
                        .gender(request.getAdminGender())
                        .build(),
                performedBy
        );

        // 7. Upload admin photo (optional) and attach it
        String adminPhotoUrl = (adminPhoto != null && !adminPhoto.isEmpty())
                ? minioService.uploadProfilePhoto(adminPhoto, tenantId, adminUser.getUserId())
                : minioService.generateDefaultAvatar(request.getAdminFullName());
        userService.updateProfilePhoto(adminUser.getUserId(), adminPhotoUrl);

        log.info("Cooperative admin created and activated for tenantId={}, userId={}",
                tenantId, adminUser.getUserId());

        return CooperativeDto.CreateResponse.builder()
                .tenantId(tenantId)
                .cooperativeId(cooperative.getCooperativeId().toString())
                .defaultBranchId(defaultBranch.getBranchId().toString())
                .defaultBranchCode(branchCode)
                .message("Cooperative onboarded and activated. Admin credentials emailed to "
                        + request.getAdminEmail() + ".")
                .adminUserId(adminUser.getUserId())
                .adminUsername(adminUser.getUsername())
                .adminEmail(adminUser.getEmail())
                .adminTemporaryPassword(adminUser.getTemporaryPassword())
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
                    response.setCountry(c.getCountry());
                    response.setAccountName(c.getAccountName());
                    response.setAccountNumber(c.getAccountNumber());
                    response.setBankBranch(c.getBankBranch());
                    response.setStatus(c.getStatus().name());
                    response.setCreatedAt(c.getCreatedAt().toString());
                    return response;
                })
                .toList();
    }

    private void seedAdminRoles(String tenantId) {
        // COOPERATIVE_ADMIN_MAKER
        if (!roleRepository.existsByNameAndTenantId("COOPERATIVE_ADMIN_MAKER", tenantId)) {
            roleRepository.save(Role.builder()
                    .name("COOPERATIVE_ADMIN_MAKER")
                    .tenantId(tenantId)
                    .description("Maker — initiates transactions and manages cooperative operations")
                    .build());
        }

        // COOPERATIVE_ADMIN_CHECKER
        if (!roleRepository.existsByNameAndTenantId("COOPERATIVE_ADMIN_CHECKER", tenantId)) {
            roleRepository.save(Role.builder()
                    .name("COOPERATIVE_ADMIN_CHECKER")
                    .tenantId(tenantId)
                    .description("Checker — reviews and approves transactions initiated by Maker")
                    .build());
        }
    }

}