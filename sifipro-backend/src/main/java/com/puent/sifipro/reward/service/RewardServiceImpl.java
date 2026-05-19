package com.puent.sifipro.reward.service;

import java.util.List;
import java.util.Locale;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.reward.dto.CreateRewardRequest;
import com.puent.sifipro.reward.dto.RewardResponse;
import com.puent.sifipro.reward.dto.UpdateRewardRequest;
import com.puent.sifipro.reward.entity.Reward;
import com.puent.sifipro.reward.repository.RewardRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RewardServiceImpl implements RewardService {

    private final RewardRepository rewardRepository;
    private final ProgramConfigRepository programConfigRepository;
    private final AppUserRepository appUserRepository;

    public RewardServiceImpl(
            RewardRepository rewardRepository,
            ProgramConfigRepository programConfigRepository,
            AppUserRepository appUserRepository) {
        this.rewardRepository = rewardRepository;
        this.programConfigRepository = programConfigRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional
    public RewardResponse createReward(CreateRewardRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        ProgramConfig programConfig = findProgramByIdAndTenantId(request.getProgramConfigId(), tenantId);

        String normalizedName = normalizeName(request.getName());
        if (rewardRepository.existsByNameIgnoreCaseAndProgramConfigId(normalizedName, programConfig.getId())) {
            throw new BusinessException("A reward with this name already exists in this program.");
        }
        validateStock(request.getStock());

        Reward reward = new Reward();
        reward.setName(normalizedName);
        reward.setDescription(normalizeDescription(request.getDescription()));
        reward.setRequiredPoints(request.getRequiredPoints());
        reward.setStock(request.getStock());
        reward.setActive(Boolean.TRUE);
        reward.setTenant(currentUser.getTenant());
        reward.setProgramConfig(programConfig);
        reward.setImageUrl(normalizeImageUrl(request.getImageUrl()));

        Reward savedReward = rewardRepository.save(reward);
        return toResponse(savedReward);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RewardResponse> getAllRewards(String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        return rewardRepository.findAllByTenantIdOrderByIdDesc(currentUser.getTenant().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RewardResponse> getRewardsByProgram(Long programConfigId, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        findProgramByIdAndTenantId(programConfigId, tenantId);

        return rewardRepository.findAllByTenantIdAndProgramConfigIdOrderByIdDesc(tenantId, programConfigId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RewardResponse getRewardById(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Reward reward = findRewardByIdAndTenantId(id, currentUser.getTenant().getId());
        return toResponse(reward);
    }

    @Override
    @Transactional
    public RewardResponse updateReward(Long id, UpdateRewardRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        Reward reward = findRewardByIdAndTenantId(id, tenantId);
        ProgramConfig targetProgram = findProgramByIdAndTenantId(request.getProgramConfigId(), tenantId);

        String normalizedName = normalizeName(request.getName());
        boolean programChanged = !reward.getProgramConfig().getId().equals(targetProgram.getId());
        boolean nameChanged = !reward.getName().equalsIgnoreCase(normalizedName);
        if ((nameChanged || programChanged)
                && rewardRepository.existsByNameIgnoreCaseAndProgramConfigId(normalizedName, targetProgram.getId())) {
            throw new BusinessException("A reward with this name already exists in this program.");
        }
        validateStock(request.getStock());

        reward.setName(normalizedName);
        reward.setDescription(normalizeDescription(request.getDescription()));
        reward.setRequiredPoints(request.getRequiredPoints());
        reward.setStock(request.getStock());
        reward.setProgramConfig(targetProgram);
        reward.setImageUrl(normalizeImageUrl(request.getImageUrl()));

        Reward updatedReward = rewardRepository.save(reward);
        return toResponse(updatedReward);
    }

    @Override
    @Transactional
    public RewardResponse activateReward(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Reward reward = findRewardByIdAndTenantId(id, currentUser.getTenant().getId());
        reward.setActive(Boolean.TRUE);

        Reward updatedReward = rewardRepository.save(reward);
        return toResponse(updatedReward);
    }

    @Override
    @Transactional
    public RewardResponse deactivateReward(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Reward reward = findRewardByIdAndTenantId(id, currentUser.getTenant().getId());
        reward.setActive(Boolean.FALSE);

        Reward updatedReward = rewardRepository.save(reward);
        return toResponse(updatedReward);
    }

    private Reward findRewardByIdAndTenantId(Long id, Long tenantId) {
        return rewardRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Reward not found with id: " + id));
    }

    private ProgramConfig findProgramByIdAndTenantId(Long programConfigId, Long tenantId) {
        return programConfigRepository.findByIdAndTenantId(programConfigId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Program not found with id: " + programConfigId));
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private RewardResponse toResponse(Reward reward) {
        RewardResponse response = new RewardResponse();
        response.setId(reward.getId());
        response.setName(reward.getName());
        response.setDescription(reward.getDescription());
        response.setRequiredPoints(reward.getRequiredPoints());
        response.setStock(reward.getStock());
        response.setActive(reward.getActive());
        response.setProgramConfigId(reward.getProgramConfig().getId());
        response.setProgramName(reward.getProgramConfig().getProgramName());
        response.setImageUrl(reward.getImageUrl());
        response.setCreatedAt(reward.getCreatedAt());
        response.setUpdatedAt(reward.getUpdatedAt());
        return response;
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmedDescription = description.trim();
        return trimmedDescription.isEmpty() ? null : trimmedDescription;
    }

    private void validateStock(Integer stock) {
        if (stock != null && stock < 0) {
            throw new BusinessException("Stock must be zero or positive.");
        }
    }

    private String normalizeImageUrl(String imageUrl) {
        if (imageUrl == null) return null;
        String trimmed = imageUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
