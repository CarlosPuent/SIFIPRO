package com.puent.sifipro.portal.controller;

import java.util.List;
import com.puent.sifipro.portal.dto.PortalDtos.GrantPortalAccessRequest;
import com.puent.sifipro.portal.dto.PortalDtos.PortalAuthResponse;
import com.puent.sifipro.portal.dto.PortalDtos.PortalLoginRequest;
import com.puent.sifipro.portal.dto.PortalDtos.PortalMovementEntry;
import com.puent.sifipro.portal.dto.PortalDtos.PortalProfileResponse;
import com.puent.sifipro.portal.dto.PortalDtos.PortalRewardEntry;
import com.puent.sifipro.portal.dto.PortalDtos.PublicTenantResponse;
import com.puent.sifipro.portal.security.CustomerPrincipal;
import com.puent.sifipro.portal.service.CustomerPortalAccessService;
import com.puent.sifipro.portal.service.CustomerPortalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Customer self-service portal (RF-08) and the tenant-side endpoints that manage access to it.
 *
 * Security (SecurityConfig): /api/public/** and /api/portal/auth/login are public;
 * /api/portal/** requires ROLE_CUSTOMER; /api/customers/{id}/portal-access requires ADMIN.
 */
@RestController
@Tag(name = "Customer portal", description = "Self-service portal for the merchant's customers (RF-08).")
public class CustomerPortalController {

    private final CustomerPortalService portalService;
    private final CustomerPortalAccessService accessService;

    public CustomerPortalController(CustomerPortalService portalService, CustomerPortalAccessService accessService) {
        this.portalService = portalService;
        this.accessService = accessService;
    }

    @GetMapping("/api/public/tenants/{code}")
    @Operation(summary = "Resolve a tenant by subdomain",
            description = "Public: returns the merchant name for its code/subdomain, used to brand the sign-in screens (RF-01).")
    public ResponseEntity<PublicTenantResponse> getPublicTenant(@PathVariable String code) {
        return ResponseEntity.ok(portalService.getPublicTenant(code));
    }

    @PostMapping("/api/portal/auth/login")
    @Operation(summary = "Customer sign-in", description = "Returns a JWT with scope CUSTOMER, valid only on /api/portal/**.")
    public ResponseEntity<PortalAuthResponse> login(@Valid @RequestBody PortalLoginRequest request) {
        return ResponseEntity.ok(portalService.login(request));
    }

    @GetMapping("/api/portal/me")
    @Operation(summary = "My profile", description = "Balance, tier, progress and balance per active program.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<PortalProfileResponse> me(Authentication authentication) {
        return ResponseEntity.ok(portalService.getProfile(principal(authentication)));
    }

    @GetMapping("/api/portal/movements")
    @Operation(summary = "My points history", description = "Latest 50 movements (earned, redeemed, adjusted).")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<PortalMovementEntry>> movements(Authentication authentication) {
        return ResponseEntity.ok(portalService.getMovements(principal(authentication)));
    }

    @GetMapping("/api/portal/rewards")
    @Operation(summary = "Rewards I can claim", description = "Active rewards with my balance in each program and the points still missing.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<PortalRewardEntry>> rewards(Authentication authentication) {
        return ResponseEntity.ok(portalService.getRewards(principal(authentication)));
    }

    @PutMapping("/api/customers/{id}/portal-access")
    @Operation(summary = "Grant portal access (ADMIN)", description = "Sets or resets the customer's portal password.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> grantAccess(
            @PathVariable Long id,
            @Valid @RequestBody GrantPortalAccessRequest request,
            Authentication authentication) {
        accessService.grantAccess(id, request.password(), authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/customers/{id}/portal-access")
    @Operation(summary = "Revoke portal access (ADMIN)", description = "Already-issued portal tokens stop working immediately.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> revokeAccess(@PathVariable Long id, Authentication authentication) {
        accessService.revokeAccess(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    private static CustomerPrincipal principal(Authentication authentication) {
        return (CustomerPrincipal) authentication.getPrincipal();
    }
}
