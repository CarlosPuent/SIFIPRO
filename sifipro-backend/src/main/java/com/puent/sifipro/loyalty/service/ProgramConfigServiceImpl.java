package com.puent.sifipro.loyalty.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import com.puent.sifipro.loyalty.dto.CreateProgramConfigRequest;
import com.puent.sifipro.loyalty.dto.ProgramConfigResponse;
import com.puent.sifipro.loyalty.dto.UpdateProgramConfigRequest;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgramConfigServiceImpl implements ProgramConfigService {

    private final ProgramConfigRepository programConfigRepository;
    private final AppUserRepository appUserRepository;

    public ProgramConfigServiceImpl(
            ProgramConfigRepository programConfigRepository,
            AppUserRepository appUserRepository) {
        this.programConfigRepository = programConfigRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional
    public ProgramConfigResponse createProgramConfig(CreateProgramConfigRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        String normalizedProgramName = normalizeProgramName(request.getProgramName());

        if (programConfigRepository.existsByProgramNameIgnoreCaseAndTenantId(normalizedProgramName, tenantId)) {
            throw new BusinessException("A program with this name already exists in this tenant.");
        }

        ProgramConfig programConfig = new ProgramConfig();
        applyValues(programConfig, normalizedProgramName, request.getPointsPerDollar(),
                request.getMinimumPurchaseAmount(), request.getActive());
        programConfig.setTenant(currentUser.getTenant());

        ProgramConfig savedProgramConfig = programConfigRepository.save(programConfig);
        return toResponse(savedProgramConfig);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgramConfigResponse> getAllProgramConfigs(String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        return programConfigRepository.findAllByTenantIdOrderByIdDesc(currentUser.getTenant().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProgramConfigResponse getProgramConfigById(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        ProgramConfig programConfig = findProgramByIdAndTenantId(id, currentUser.getTenant().getId());
        return toResponse(programConfig);
    }

    @Override
    @Transactional
    public ProgramConfigResponse updateProgramConfig(Long id, UpdateProgramConfigRequest request,
            String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        ProgramConfig programConfig = findProgramByIdAndTenantId(id, tenantId);
        String normalizedProgramName = normalizeProgramName(request.getProgramName());
        boolean nameChanged = !programConfig.getProgramName().equalsIgnoreCase(normalizedProgramName);

        if (nameChanged
                && programConfigRepository.existsByProgramNameIgnoreCaseAndTenantId(normalizedProgramName, tenantId)) {
            throw new BusinessException("A program with this name already exists in this tenant.");
        }

        applyValues(programConfig, normalizedProgramName, request.getPointsPerDollar(),
                request.getMinimumPurchaseAmount(), request.getActive());

        ProgramConfig updatedProgramConfig = programConfigRepository.save(programConfig);
        return toResponse(updatedProgramConfig);
    }

    @Override
    @Transactional
    public ProgramConfigResponse activateProgramConfig(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        ProgramConfig programConfig = findProgramByIdAndTenantId(id, currentUser.getTenant().getId());
        programConfig.setActive(Boolean.TRUE);

        ProgramConfig updatedProgramConfig = programConfigRepository.save(programConfig);
        return toResponse(updatedProgramConfig);
    }

    @Override
    @Transactional
    public ProgramConfigResponse deactivateProgramConfig(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        ProgramConfig programConfig = findProgramByIdAndTenantId(id, currentUser.getTenant().getId());
        programConfig.setActive(Boolean.FALSE);

        ProgramConfig updatedProgramConfig = programConfigRepository.save(programConfig);
        return toResponse(updatedProgramConfig);
    }

    private ProgramConfig findProgramByIdAndTenantId(Long id, Long tenantId) {
        return programConfigRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Program not found with id: " + id));
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private void applyValues(ProgramConfig entity, String programName, BigDecimal pointsPerDollar,
            BigDecimal minimumPurchaseAmount, Boolean active) {
        entity.setProgramName(programName);
        entity.setPointsPerDollar(pointsPerDollar);
        entity.setMinimumPurchaseAmount(minimumPurchaseAmount);
        entity.setActive(active);
    }

    private ProgramConfigResponse toResponse(ProgramConfig entity) {
        ProgramConfigResponse response = new ProgramConfigResponse();
        response.setId(entity.getId());
        response.setProgramName(entity.getProgramName());
        response.setPointsPerDollar(entity.getPointsPerDollar());
        response.setMinimumPurchaseAmount(entity.getMinimumPurchaseAmount());
        response.setActive(entity.getActive());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeProgramName(String programName) {
        return programName == null ? null : programName.trim();
    }
}
