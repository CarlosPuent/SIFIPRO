package com.puent.sifipro.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authentication response with access token and user information.")
public class AuthResponse {

    @Schema(description = "JWT access token.")
    private String accessToken;

    @Schema(description = "Token type.", example = "Bearer")
    private String tokenType;

    private AuthUserResponse user;

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public AuthUserResponse getUser() {
        return user;
    }

    public void setUser(AuthUserResponse user) {
        this.user = user;
    }
}
