package com.puent.sifipro.platform.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.puent.sifipro.platform.tenant.entity.Tenant;
import com.puent.sifipro.platform.user.entity.AppUser;
import com.puent.sifipro.platform.user.entity.UserRole;
import com.puent.sifipro.platform.user.repository.AppUserRepository;

/**
 * Pure unit tests (Mockito, no Spring context, no database): only tenant-less
 * PLATFORM_ADMIN rows may authenticate on platform-api.
 */
@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    private static final String EMAIL = "operator@sifipro.test";

    @Mock
    private AppUserRepository appUserRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void platformAdminWithoutTenant_isLoaded() {
        givenUser(UserRole.PLATFORM_ADMIN, null);

        UserDetails details = customUserDetailsService.loadUserByUsername(EMAIL);

        assertThat(details.getUsername()).isEqualTo(EMAIL);
        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_PLATFORM_ADMIN");
    }

    @Test
    void platformAdminBoundToTenant_isRejected() {
        Tenant tenant = new Tenant();
        givenUser(UserRole.PLATFORM_ADMIN, tenant);

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(EMAIL))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void tenantAdmin_isRejected() {
        Tenant tenant = new Tenant();
        givenUser(UserRole.ADMIN, tenant);

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername(EMAIL))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    private void givenUser(UserRole role, Tenant tenant) {
        AppUser user = new AppUser();
        user.setEmail(EMAIL);
        user.setPasswordHash("hash");
        user.setRole(role);
        user.setActive(Boolean.TRUE);
        user.setTenant(tenant);
        when(appUserRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));
    }
}
