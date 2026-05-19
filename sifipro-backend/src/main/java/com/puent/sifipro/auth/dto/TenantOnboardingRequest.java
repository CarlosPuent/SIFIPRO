package com.puent.sifipro.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to create a tenant and its initial administrator.")
public class TenantOnboardingRequest {

    @Schema(description = "Tenant display name.", example = "Acme Retail")
    @NotBlank(message = "Tenant name is required")
    @Size(max = 150, message = "Tenant name must not exceed 150 characters")
    private String tenantName;

    @Schema(description = "Tenant unique code.", example = "acme")
    @NotBlank(message = "Tenant code is required")
    @Size(max = 100, message = "Tenant code must not exceed 100 characters")
    private String tenantCode;

    @Schema(description = "Administrator first name.", example = "Ana")
    @NotBlank(message = "Admin first name is required")
    @Size(max = 100, message = "Admin first name must not exceed 100 characters")
    private String adminFirstName;

    @Schema(description = "Administrator last name.", example = "Gomez")
    @NotBlank(message = "Admin last name is required")
    @Size(max = 100, message = "Admin last name must not exceed 100 characters")
    private String adminLastName;

    @Schema(description = "Administrator email (unique).", example = "admin@acme.com")
    @NotBlank(message = "Admin email is required")
    @Email(message = "Admin email must be a valid format")
    @Size(max = 150, message = "Admin email must not exceed 150 characters")
    private String adminEmail;

    @Schema(description = "Administrator password.", example = "Admin12345")
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;

    public String getTenantName() {
        return tenantName;
    }

    public void setTenantName(String tenantName) {
        this.tenantName = tenantName;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getAdminFirstName() {
        return adminFirstName;
    }

    public void setAdminFirstName(String adminFirstName) {
        this.adminFirstName = adminFirstName;
    }

    public String getAdminLastName() {
        return adminLastName;
    }

    public void setAdminLastName(String adminLastName) {
        this.adminLastName = adminLastName;
    }

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
