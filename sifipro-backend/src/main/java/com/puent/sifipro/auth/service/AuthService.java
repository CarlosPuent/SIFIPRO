package com.puent.sifipro.auth.service;

import com.puent.sifipro.auth.dto.AuthResponse;
import com.puent.sifipro.auth.dto.AuthUserResponse;
import com.puent.sifipro.auth.dto.LoginRequest;
import com.puent.sifipro.auth.dto.TenantOnboardingRequest;

public interface AuthService {

    AuthResponse onboarding(TenantOnboardingRequest request);

    AuthResponse login(LoginRequest request);

    AuthUserResponse getCurrentUser(String email);
}
