package com.puent.sifipro.portal.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.puent.sifipro.customer.dto.CustomerTierProgressResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request and response payloads of the customer self-service portal (RF-08). */
public final class PortalDtos {

    private PortalDtos() {
    }

    @Schema(description = "Customer portal sign-in. The tenant code is the merchant's subdomain.")
    public record PortalLoginRequest(
            @Schema(example = "demo") @NotBlank(message = "Tenant code is required")
            @Size(max = 100, message = "Tenant code must not exceed 100 characters") String tenantCode,
            @Schema(example = "laura.mendoza@sifipro.dev") @NotBlank(message = "Email is required")
            @Email(message = "Email must be a valid format")
            @Size(max = 150, message = "Email must not exceed 150 characters") String email,
            @Schema(example = "Cliente123!") @NotBlank(message = "Password is required")
            @Size(max = 100, message = "Password must not exceed 100 characters") String password) {
    }

    public record PortalAuthResponse(String accessToken, String tokenType, PortalProfileResponse customer) {
    }

    public record PortalTenant(String code, String name) {
    }

    @Schema(description = "Points the customer holds in one active program.")
    public record PortalProgramBalance(Long programId, String programName, BigDecimal pointsBalance) {
    }

    public record PortalProfileResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phone,
            LocalDateTime memberSince,
            PortalTenant tenant,
            BigDecimal pointsBalance,
            String tier,
            CustomerTierProgressResponse tierProgress,
            List<PortalProgramBalance> programs) {
    }

    @Schema(description = "One entry of the customer's points history. Points are signed (+earned / -redeemed).")
    public record PortalMovementEntry(
            Long id,
            LocalDateTime date,
            String type,
            String programName,
            BigDecimal points,
            String description) {
    }

    @Schema(description = "A reward of an active program and whether the customer can afford it today.")
    public record PortalRewardEntry(
            Long id,
            String name,
            String description,
            String imageUrl,
            Long programId,
            String programName,
            BigDecimal requiredPoints,
            int stock,
            BigDecimal programBalance,
            BigDecimal pointsMissing,
            boolean available) {
    }

    @Schema(description = "Password the ADMIN sets so the customer can sign in to the portal.")
    public record GrantPortalAccessRequest(
            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters") String password) {
    }

    @Schema(description = "Public data of a tenant resolved from its subdomain (used by the sign-in screens).")
    public record PublicTenantResponse(String code, String name, boolean active) {
    }
}
