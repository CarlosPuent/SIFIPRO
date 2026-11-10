package com.puent.sifipro.platform.tenant.service;

import com.puent.sifipro.platform.tenant.dto.CreateTenantRequest;
import com.puent.sifipro.platform.tenant.dto.TenantResponse;
import com.puent.sifipro.platform.tenant.dto.UpdateTenantRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TenantService {

    TenantResponse createTenant(CreateTenantRequest request);

    Page<TenantResponse> listTenants(Pageable pageable);

    TenantResponse getTenantById(Long id);

    TenantResponse updateTenant(Long id, UpdateTenantRequest request);

    TenantResponse activateTenant(Long id);

    TenantResponse deactivateTenant(Long id);
}
