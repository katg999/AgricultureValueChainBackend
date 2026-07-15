package com.ugaap.membership.service;


import com.ugaap.membership.Entity.Cooperative;
import com.ugaap.membership.Entity.Member;
import com.ugaap.membership.dto.FarmerSearchResultDTO;
import com.ugaap.membership.dto.MemberDto;
import com.ugaap.membership.repository.BranchRepository;
import com.ugaap.membership.repository.CooperativeRepository;
import com.ugaap.membership.repository.MemberRepository;
import com.ugaap.shared.Exception.AuthException; //Look here
import com.ugaap.shared.util.MinioService;      //look here
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

import com.ugaap.membership.Entity.Branch;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository     memberRepository;
    private final CooperativeRepository cooperativeRepository;
    private final MinioService         minioService;
    private final BranchRepository branchRepository;



    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateMemberCode() {
        String code;
        do {
            code = String.format("%05d", RANDOM.nextInt(100000)); // 00000–99999
        } while (memberRepository.existsByMemberCode(code));
        return code;
    }


    //Register a UGAAP FARMER
    @Transactional
    public MemberDto.Response registerMember(
            MemberDto.CreateRequest request,
            MultipartFile photo,
            String registeredBy) {

        // 1. National ID uniqueness check
        if (memberRepository.existsByNationalId(request.getNationalId())) {
            throw new AuthException(
                    "Member with National ID '"
                            + request.getNationalId()
                            + "' is already registered");
        }

        // 2. Validate cooperative exists
        // Replace lines 47-50 with:
        Cooperative cooperative = cooperativeRepository
                .findByTenantId(request.getTenantId())
                .orElseThrow(() -> new AuthException(
                        "Cooperative not found for tenantId: "
                                + request.getTenantId()));

        // 3. Generate member ID early (needed for photo path)

        String tempId = UUID.randomUUID().toString();

        // 4. Handle photo upload
        String photoUrl;
        if (photo != null && !photo.isEmpty()) {
            photoUrl = minioService.uploadProfilePhoto(
                    photo,
                    request.getTenantId(),
                    tempId
            );
        } else {
            // Use generated avatar as default
            photoUrl = minioService.generateDefaultAvatar(
                    request.getFullName());
        }

        // 5. Build and save member
        Member member = Member.builder()
                .fullName(request.getFullName())
                .nationalId(request.getNationalId())
                .phoneNumber(request.getPhoneNumber())
                .memberCode(generateMemberCode())
                .gender(request.getGender())
                .email(request.getEmail())
                .dateOfBirth(request.getDateOfBirth())
                .profilePhotoUrl(photoUrl)
                .farmLocation(request.getFarmLocation())
                .villageTown(request.getVillageTown())
                .totalLandAreaHectares(request.getTotalLandAreaHectares())
                .landOwnershipType(request.getLandOwnershipType())
                .primaryCrops(request.getPrimaryCrops())
                .paymentMethodType(request.getPaymentMethodType())
                .irrigationSource(request.getIrrigationSource())
                .bankName(request.getBankName())
                .bankBranch(request.getBankBranch())
                .accountHolderName(request.getAccountHolderName())
                .walletNumber(request.getWalletNumber())
                .accountNumber(request.getAccountNumber())
                .cooperative(cooperative)
                .tenantId(request.getTenantId())
                .commodityToDeliver(request.getCommodityToDeliver())   // ← add this
                .livestockKept(request.getLivestockKept())
                .branchId(request.getBranchId() != null && !request.getBranchId().isBlank()
                        ? UUID.fromString(request.getBranchId()) : null)
                .status(Member.MemberStatus.ACTIVE)
                .registeredBy(registeredBy)
                .build();

        memberRepository.save(member);
        log.info("Member registered: nationalId={}, tenantId={}",
                request.getNationalId(), request.getTenantId());

        return mapToResponse(member);
    }

    // ── Get member ────────────────────────────────────────────

    public MemberDto.Response getMember(String memberId) {
        Member member = memberRepository
                .findById(UUID.fromString(memberId))
                .orElseThrow(() -> new AuthException(
                        "Member not found: " + memberId));
        return mapToResponse(member);
    }

    // ── List members ──────────────────────────────────────────

    public List<MemberDto.Response> listMembers(String tenantId, String branchId) {
        List<Member> members = branchId != null
                ? memberRepository.findAllByTenantIdAndBranchId(tenantId, UUID.fromString(branchId))
                : memberRepository.findAllByTenantId(tenantId);

        Set<UUID> branchIds = members.stream()
                .map(Member::getBranchId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> branchNamesById = branchIds.isEmpty()
                ? Map.of()
                : branchRepository.findAllByBranchIdIn(branchIds).stream()
                  .collect(Collectors.toMap(Branch::getBranchId, Branch::getName));

        return members.stream()
                .map(m -> buildResponse(m, branchNamesById.get(m.getBranchId())))
                .toList();
    }


    // ── Update member ─────────────────────────────────────────

    @Transactional
    public MemberDto.Response updateMember(
            String memberId,
            MemberDto.CreateRequest request,
            MultipartFile photo) {

        Member member = memberRepository
                .findById(UUID.fromString(memberId))
                .orElseThrow(() -> new AuthException(
                        "Member not found: " + memberId));

        // Update photo if provided
        if (photo != null && !photo.isEmpty()) {
            String photoUrl = minioService.uploadProfilePhoto(
                    photo,
                    member.getTenantId(),
                    memberId
            );
            member.setProfilePhotoUrl(photoUrl);
        }

        member.setFullName(request.getFullName());
        member.setPhoneNumber(request.getPhoneNumber());
        member.setEmail(request.getEmail());
        member.setDateOfBirth(request.getDateOfBirth());
        member.setFarmLocation(request.getFarmLocation());
        member.setVillageTown(request.getVillageTown());
        member.setTotalLandAreaHectares(request.getTotalLandAreaHectares());
        member.setLandOwnershipType(request.getLandOwnershipType());
        member.setAccountNumber(request.getAccountNumber());
        member.setAccountHolderName(request.getAccountHolderName());
        member.setWalletNumber(request.getWalletNumber());
        member.setIrrigationSource(request.getIrrigationSource());
        member.setBankBranch(request.getBankBranch());
        member.setBankName(request.getBankName());
        member.setPaymentMethodType(request.getPaymentMethodType());
        member.setCommodityToDeliver(request.getCommodityToDeliver());
        member.setLivestockKept(request.getLivestockKept());

        //member.setCattleCount(request.getCattleCount());
        //member.setGoatsCount(request.getGoatsCount());
        //member.setPoultryCount(request.getPoultryCount());

        memberRepository.save(member);
        log.info("Member updated: memberId={}", memberId);

        return mapToResponse(member);
    }

    // ── Deactivate member ─────────────────────────────────────

    @Transactional
    public void deactivateMember(String memberId) {
        Member member = memberRepository
                .findById(UUID.fromString(memberId))
                .orElseThrow(() -> new AuthException(
                        "Member not found: " + memberId));

        member.setStatus(Member.MemberStatus.INACTIVE);
        memberRepository.save(member);
        log.info("Member deactivated: memberId={}", memberId);
    }


    // ── Helper ────────────────────────────────────────────────

    private MemberDto.Response mapToResponse(Member member) {
        String branchName = member.getBranchId() != null
                ? branchRepository.findById(member.getBranchId())
                  .map(Branch::getName)
                  .orElse(null)
                : null;
        return buildResponse(member, branchName);
    }

    public MemberDto.Response getMemberByCode(String memberCode) {
        Member member = memberRepository.findByMemberCode(memberCode)
                .orElseThrow(() -> new AuthException("Member not found: " + memberCode));
        return mapToResponse(member);
    }


    private MemberDto.Response buildResponse(Member member, String branchName) {
        return MemberDto.Response.builder()
                .memberId(member.getMemberId().toString())
                .fullName(member.getFullName())
                .memberCode(member.getMemberCode())
                .nationalId(member.getNationalId())
                .phoneNumber(member.getPhoneNumber())
                .gender(member.getGender().name())
                .email(member.getEmail())
                .dateOfBirth(member.getDateOfBirth() != null ? member.getDateOfBirth().toString() : null)
                .profilePhotoUrl(member.getProfilePhotoUrl())
                .farmLocation(member.getFarmLocation() != null ? member.getFarmLocation().name() : null)
                .villageTown(member.getVillageTown())
                .totalLandAreaHectares(member.getTotalLandAreaHectares())
                .cooperativeId(member.getCooperative().getCooperativeId().toString())
                .tenantId(member.getTenantId())
                .paymentMethodType(member.getPaymentMethodType() != null ? member.getPaymentMethodType().name() : null)
                .bankName(member.getBankName())
                .bankBranch(member.getBankBranch())
                .irrigationSource(member.getIrrigationSource() != null ? member.getIrrigationSource().name() : null)
                .accountHolderName(member.getAccountHolderName())
                .walletNumber(member.getWalletNumber())
                .accountNumber(member.getAccountNumber())
                .commodityToDeliver(member.getCommodityToDeliver())
                .livestockKept(member.getLivestockKept())
                .branchId(member.getBranchId() != null ? member.getBranchId().toString() : null)
                .branchName(branchName)
                .status(member.getStatus().name())
                .registeredBy(member.getRegisteredBy())
                .createdAt(member.getCreatedAt() != null ? member.getCreatedAt().toString() : null)
                .build();
    }



    @Transactional(readOnly = true)
    public List<FarmerSearchResultDTO> searchFarmers(String query) {
        return memberRepository
                .searchFarmersByName(query, Member.MemberStatus.ACTIVE)
                .stream()
                .map(m -> FarmerSearchResultDTO.builder()
                        .memberId(m.getMemberId().toString())
                        .fullName(m.getFullName())
                        .branchId(m.getBranchId() != null ? m.getBranchId().toString() : null)
                        .build())
                .toList();
    }


}
