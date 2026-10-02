package com.puent.sifipro.auth.security;

import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;

    public CustomUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = appUserRepository.findWithTenantByEmailIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

        // A user without tenant (PLATFORM_ADMIN) is treated as "tenant inactive" so its
        // tokens can never operate tenant-scoped endpoints.
        Tenant tenant = user.getTenant();
        boolean tenantActive = tenant != null && Boolean.TRUE.equals(tenant.getActive());

        return new AuthenticatedUser(
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole().name(),
                Boolean.TRUE.equals(user.getActive()),
                tenantActive);
    }
}
