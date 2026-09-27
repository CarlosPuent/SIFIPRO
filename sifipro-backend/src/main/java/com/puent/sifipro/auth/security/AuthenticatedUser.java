package com.puent.sifipro.auth.security;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Security principal for tenant-api. Besides the standard credentials it carries
 * whether the user's tenant is active, so JwtAuthenticationFilter can reject
 * already-issued tokens as soon as a tenant is suspended.
 *
 * tenantActive is deliberately NOT mapped to isAccountNonLocked(): Spring checks the
 * lock flag before the password, which would reveal a suspended tenant to anyone who
 * knows an email. Login checks it after the password instead (AuthServiceImpl).
 */
public class AuthenticatedUser implements UserDetails {

    private final String email;
    private final String passwordHash;
    private final String role;
    private final boolean active;
    private final boolean tenantActive;

    public AuthenticatedUser(String email, String passwordHash, String role, boolean active, boolean tenantActive) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
        this.tenantActive = tenantActive;
    }

    public boolean isTenantActive() {
        return tenantActive;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
