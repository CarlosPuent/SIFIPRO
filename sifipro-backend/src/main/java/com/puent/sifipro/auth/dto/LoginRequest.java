package com.puent.sifipro.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to authenticate a user.")
public class LoginRequest {

    @Schema(description = "User email.", example = "staff@sifipro.dev")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid format")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @Schema(description = "User password.", example = "Staff12345")
    @NotBlank(message = "Password is required")
    @Size(max = 100, message = "Password must not exceed 100 characters")
    private String password;

    @Schema(description = "Optional tenant code taken from the subdomain (RF-01). When present, the user must belong to that tenant.", example = "demo")
    @Size(max = 100, message = "Tenant code must not exceed 100 characters")
    private String tenantCode;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }
}
