package com.puent.sifipro.platform.auth.service;

import com.puent.sifipro.platform.auth.dto.AuthResponse;
import com.puent.sifipro.platform.auth.dto.AuthUserResponse;
import com.puent.sifipro.platform.auth.dto.LoginRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthUserResponse getCurrentUser(String email);
}
