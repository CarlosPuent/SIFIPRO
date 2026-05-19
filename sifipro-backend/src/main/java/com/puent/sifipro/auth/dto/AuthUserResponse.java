package com.puent.sifipro.auth.dto;

import com.puent.sifipro.user.entity.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authenticated user information returned by auth endpoints.")
public class AuthUserResponse {

    @Schema(description = "User identifier.", example = "1")
    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private UserRole role;

    private Boolean active;

    private TenantSummaryResponse tenant;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public TenantSummaryResponse getTenant() {
        return tenant;
    }

    public void setTenant(TenantSummaryResponse tenant) {
        this.tenant = tenant;
    }
}
