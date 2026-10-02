package com.puent.sifipro.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import com.puent.sifipro.auth.dto.AuthResponse;
import com.puent.sifipro.auth.dto.LoginRequest;
import com.puent.sifipro.auth.security.JwtService;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Pure unit tests (Mockito, no Spring context, no database) for tenant-api login.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String EMAIL = "admin@tenant.test";

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    private AuthServiceImpl authService;
    private Tenant tenant;
    private AppUser user;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(appUserRepository, authenticationManager, jwtService);

        tenant = new Tenant();
        tenant.setId(10L);
        tenant.setName("Tenant");
        tenant.setCode("tenant");
        tenant.setActive(Boolean.TRUE);

        user = new AppUser();
        user.setId(1L);
        user.setFirstName("Ana");
        user.setLastName("Admin");
        user.setEmail(EMAIL);
        user.setPasswordHash("hash");
        user.setRole(UserRole.ADMIN);
        user.setActive(Boolean.TRUE);
        user.setTenant(tenant);

        // Credentials are valid in every scenario: only the tenant state changes.
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(EMAIL, null));
        when(appUserRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));
    }

    @Test
    void login_withSuspendedTenant_isRejectedAndNoTokenIsIssued() {
        tenant.setActive(Boolean.FALSE);

        assertThatThrownBy(() -> authService.login(loginRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Tenant account is suspended.");

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_withActiveTenant_issuesToken() {
        when(jwtService.generateToken(user)).thenReturn("signed.jwt.token");

        AuthResponse response = authService.login(loginRequest());

        assertThat(response.getAccessToken()).isEqualTo("signed.jwt.token");
        assertThat(response.getUser().getTenant().getActive()).isTrue();
    }

    private static LoginRequest loginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail(EMAIL);
        request.setPassword("Admin123!");
        return request;
    }
}
