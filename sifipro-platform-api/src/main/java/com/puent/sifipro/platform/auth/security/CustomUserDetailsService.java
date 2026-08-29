package com.puent.sifipro.platform.auth.security;

import com.puent.sifipro.platform.user.entity.AppUser;
import com.puent.sifipro.platform.user.entity.UserRole;
import com.puent.sifipro.platform.user.repository.AppUserRepository;
import org.springframework.security.core.userdetails.User;
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
        AppUser user = appUserRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

        // app_users is shared with tenant-api: ADMIN/STAFF rows for tenant users live in
        // the same table. Only PLATFORM_ADMIN may authenticate here — treat any other
        // role exactly like "user not found" so callers can never distinguish a wrong
        // password from an existing-but-wrong-audience account.
        if (user.getRole() != UserRole.PLATFORM_ADMIN) {
            throw new UsernameNotFoundException("User not found with email: " + username);
        }

        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .disabled(!Boolean.TRUE.equals(user.getActive()))
                .build();
    }
}
