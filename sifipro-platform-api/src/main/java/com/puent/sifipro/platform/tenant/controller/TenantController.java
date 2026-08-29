package com.puent.sifipro.platform.tenant.controller;

import com.puent.sifipro.platform.tenant.dto.CreateTenantRequest;
import com.puent.sifipro.platform.tenant.dto.TenantResponse;
import com.puent.sifipro.platform.tenant.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tenant lifecycle management. Reachable only by PLATFORM_ADMIN — enforced by
 * SecurityConfig's catch-all rule for /api/platform/** (this path isn't in the
 * permitAll list, so it falls through to .hasRole("PLATFORM_ADMIN")).
 */
@RestController
@RequestMapping("/api/platform/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    public ResponseEntity<TenantResponse> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        TenantResponse response = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<TenantResponse>> listTenants(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(tenantService.listTenants(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantResponse> getTenantById(@PathVariable Long id) {
        return ResponseEntity.ok(tenantService.getTenantById(id));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<TenantResponse> activateTenant(@PathVariable Long id) {
        return ResponseEntity.ok(tenantService.activateTenant(id));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<TenantResponse> deactivateTenant(@PathVariable Long id) {
        return ResponseEntity.ok(tenantService.deactivateTenant(id));
    }
}
