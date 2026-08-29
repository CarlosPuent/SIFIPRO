package com.puent.sifipro.platform.auth.service;

import java.util.Locale;
import com.puent.sifipro.platform.auth.dto.AuthResponse;
import com.puent.sifipro.platform.auth.dto.AuthUserResponse;
import com.puent.sifipro.platform.auth.dto.LoginRequest;
import com.puent.sifipro.platform.auth.security.JwtService;
import com.puent.sifipro.platform.shared.exception.BusinessException;
import com.puent.sifipro.platform.user.entity.AppUser;
import com.puent.sifipro.platform.user.repository.AppUserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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

        // Deliberately not caught here: CustomUserDetailsService already rejects any
        // AppUser whose role isn't PLATFORM_ADMIN (treating it exactly like "not
        // found"), and any other AuthenticationException (bad password, disabled
        // account, unknown email) propagates up through Spring Security's
        // ExceptionTranslationFilter to RestAuthenticationEntryPoint, producing a
        // uniform 401 response that never reveals which of those cases occurred.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));

        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BusinessException("Authenticated user could not be reloaded."));

        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(String email) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new BusinessException("Authenticated user not found."));
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
        AuthUserResponse response = new AuthUserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setActive(user.getActive());
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
