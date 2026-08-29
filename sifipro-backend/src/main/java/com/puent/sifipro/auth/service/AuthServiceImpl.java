package com.puent.sifipro.auth.service;

import java.util.Locale;
import com.puent.sifipro.auth.dto.AuthResponse;
import com.puent.sifipro.auth.dto.AuthUserResponse;
import com.puent.sifipro.auth.dto.LoginRequest;
import com.puent.sifipro.auth.dto.TenantSummaryResponse;
import com.puent.sifipro.auth.security.JwtService;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    private final AppUserRepository appUserRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthServiceImpl(
            AppUserRepository appUserRepository,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.appUserRepository = appUserRepository;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));
        } catch (DisabledException ex) {
            throw new BusinessException("User account is inactive.");
        } catch (BadCredentialsException ex) {
            throw new BusinessException("Invalid email or password.");
        } catch (AuthenticationException ex) {
            throw new BusinessException("Invalid email or password.");
        }

        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BusinessException("Invalid email or password."));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BusinessException("User account is inactive.");
        }
        if (user.getTenant() == null) {
            throw new BusinessException("User account is not associated with a tenant.");
        }

        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(String email) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));
        return toUserResponse(user);
    }

    private AuthResponse toAuthResponse(AppUser user, String token) {
        AuthResponse response = new AuthResponse();
        response.setAccessToken(token);
        response.setTokenType(TOKEN_TYPE);
        response.setUser(toUserResponse(user));
        return response;
    }

    private AuthUserResponse toUserResponse(AppUser user) {
        if (user.getTenant() == null) {
            throw new BusinessException("User account is not associated with a tenant.");
        }

        AuthUserResponse response = new AuthUserResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setActive(user.getActive());
        response.setTenant(toTenantResponse(user.getTenant()));
        return response;
    }

    private TenantSummaryResponse toTenantResponse(Tenant tenant) {
        TenantSummaryResponse response = new TenantSummaryResponse();
        response.setId(tenant.getId());
        response.setName(tenant.getName());
        response.setCode(tenant.getCode());
        response.setActive(tenant.getActive());
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
