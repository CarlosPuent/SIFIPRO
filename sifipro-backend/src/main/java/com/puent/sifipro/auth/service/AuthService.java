package com.puent.sifipro.auth.service;

import com.puent.sifipro.auth.dto.AuthResponse;
import com.puent.sifipro.auth.dto.AuthUserResponse;
import com.puent.sifipro.auth.dto.LoginRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthUserResponse getCurrentUser(String email);
}
