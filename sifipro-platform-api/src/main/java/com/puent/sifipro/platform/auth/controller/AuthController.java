package com.puent.sifipro.platform.auth.controller;

import com.puent.sifipro.platform.auth.dto.AuthResponse;
import com.puent.sifipro.platform.auth.dto.AuthUserResponse;
import com.puent.sifipro.platform.auth.dto.LoginRequest;
import com.puent.sifipro.platform.auth.service.AuthService;
import com.puent.sifipro.platform.shared.exception.BusinessException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException("Unauthenticated request.");
        }

        AuthUserResponse response = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(response);
    }
}
