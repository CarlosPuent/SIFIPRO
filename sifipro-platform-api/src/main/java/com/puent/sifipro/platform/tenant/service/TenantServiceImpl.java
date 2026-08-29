package com.puent.sifipro.platform.tenant.service;

import java.time.LocalDateTime;
import java.util.Locale;
import com.puent.sifipro.platform.shared.exception.ConflictException;
import com.puent.sifipro.platform.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.platform.tenant.dto.CreateTenantRequest;
import com.puent.sifipro.platform.tenant.dto.TenantResponse;
import com.puent.sifipro.platform.tenant.entity.Tenant;
import com.puent.sifipro.platform.tenant.repository.TenantRepository;
import com.puent.sifipro.platform.user.entity.AppUser;
import com.puent.sifipro.platform.user.entity.UserRole;
import com.puent.sifipro.platform.user.repository.AppUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public TenantServiceImpl(
            TenantRepository tenantRepository,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder) {
        this.tenantRepository = tenantRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public TenantResponse createTenant(CreateTenantRequest request) {
        String normalizedCode = normalizeCode(request.getCode());
        if (tenantRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new ConflictException("A tenant with this code already exists.");
        }

        String normalizedEmail = normalizeEmail(request.getAdminEmail());
        if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("A user with this email already exists.");
        }

        LocalDateTime now = LocalDateTime.now();

        Tenant tenant = new Tenant();
        tenant.setName(request.getName().trim());
        tenant.setCode(normalizedCode);
        tenant.setActive(Boolean.TRUE);
        tenant.setCreatedAt(now);
        tenant.setUpdatedAt(now);
        Tenant savedTenant = tenantRepository.save(tenant);

        AppUser admin = new AppUser();
        admin.setFirstName(request.getAdminFirstName().trim());
        admin.setLastName(request.getAdminLastName().trim());
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(request.getAdminPassword()));
        admin.setRole(UserRole.ADMIN);
        admin.setActive(Boolean.TRUE);
        admin.setTenant(savedTenant);
        admin.setCreatedAt(now);
        admin.setUpdatedAt(now);
        appUserRepository.save(admin);

        return toResponse(savedTenant);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TenantResponse> listTenants(Pageable pageable) {
        return tenantRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantResponse getTenantById(Long id) {
        return toResponse(findTenantById(id));
    }

    @Override
    @Transactional
    public TenantResponse activateTenant(Long id) {
        Tenant tenant = findTenantById(id);
        tenant.setActive(Boolean.TRUE);
        tenant.setUpdatedAt(LocalDateTime.now());
        Tenant updatedTenant = tenantRepository.save(tenant);
        return toResponse(updatedTenant);
    }

    @Override
    @Transactional
    public TenantResponse deactivateTenant(Long id) {
        Tenant tenant = findTenantById(id);
        tenant.setActive(Boolean.FALSE);
        tenant.setUpdatedAt(LocalDateTime.now());
        Tenant updatedTenant = tenantRepository.save(tenant);
        return toResponse(updatedTenant);
    }

    private Tenant findTenantById(Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + id));
    }

    private TenantResponse toResponse(Tenant tenant) {
        TenantResponse response = new TenantResponse();
        response.setId(tenant.getId());
        response.setName(tenant.getName());
        response.setCode(tenant.getCode());
        response.setActive(tenant.getActive());
        response.setCreatedAt(tenant.getCreatedAt());
        response.setUpdatedAt(tenant.getUpdatedAt());
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCode(String code) {
        return code == null ? null : code.trim().toLowerCase(Locale.ROOT);
    }
}
