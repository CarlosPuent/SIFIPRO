package com.puent.sifipro.auth.controller;

import com.puent.sifipro.auth.dto.AuthResponse;
import com.puent.sifipro.auth.dto.AuthUserResponse;
import com.puent.sifipro.auth.dto.LoginRequest;
import com.puent.sifipro.auth.dto.TenantOnboardingRequest;
import com.puent.sifipro.auth.service.AuthService;
import com.puent.sifipro.shared.exception.BusinessException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "JWT authentication endpoints for onboarding, login, and current user retrieval.")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/onboarding")
    @Operation(summary = "Tenant onboarding", description = "Creates a tenant and its initial ADMIN user.")
    public ResponseEntity<AuthResponse> onboarding(@Valid @RequestBody TenantOnboardingRequest request) {
        AuthResponse response = authService.onboarding(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates a user and returns a JWT access token.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the currently authenticated user derived from the JWT context.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<AuthUserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException("Unauthenticated request.");
        }

        AuthUserResponse response = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(response);
    }
}
