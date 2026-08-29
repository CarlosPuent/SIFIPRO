package com.puent.sifipro.platform.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.puent.sifipro.platform.user.entity.AppUser;
import com.puent.sifipro.platform.user.entity.UserRole;
import com.puent.sifipro.platform.user.repository.AppUserRepository;

/**
 * Exercises AuthController's login flow through the real HTTP layer, covering the
 * PLATFORM_ADMIN-only gate enforced by CustomUserDetailsService.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final List<Long> createdAppUserIds = new ArrayList<>();

    @AfterEach
    void cleanUpTestData() {
        createdAppUserIds.forEach(appUserRepository::deleteById);
        createdAppUserIds.clear();
    }

    @Test
    void login_withValidPlatformAdmin_returns200AndParseableJwtWithCorrectRole() throws Exception {
        String email = "auth-test-platform-admin-" + System.nanoTime() + "@sifipro-test.dev";
        String rawPassword = "PlatformTest123!";
        createAppUser(email, rawPassword, UserRole.PLATFORM_ADMIN);

        String requestBody = """
                {"email": "%s", "password": "%s"}
                """.formatted(email, rawPassword);

        MvcResult result = mockMvc.perform(post("/api/platform/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.role").value("PLATFORM_ADMIN"))
                .andExpect(jsonPath("$.user.email").value(email))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String token = JsonPath.read(responseBody, "$.accessToken");

        assertThat(token).isNotBlank();
        // A JWT is 3 dot-separated, non-empty, base64url segments (header.payload.signature).
        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3);
        assertThat(parts[0]).isNotBlank();
        assertThat(parts[1]).isNotBlank();
        assertThat(parts[2]).isNotBlank();
    }

    @Test
    void login_withTenantAdminRole_returns401EvenWithCorrectPassword() throws Exception {
        String email = "auth-test-tenant-admin-" + System.nanoTime() + "@sifipro-test.dev";
        String rawPassword = "TenantAdmin123!";
        createAppUser(email, rawPassword, UserRole.ADMIN);

        String requestBody = """
                {"email": "%s", "password": "%s"}
                """.formatted(email, rawPassword);

        mockMvc.perform(post("/api/platform/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withStaffRole_returns401EvenWithCorrectPassword() throws Exception {
        String email = "auth-test-tenant-staff-" + System.nanoTime() + "@sifipro-test.dev";
        String rawPassword = "TenantStaff123!";
        createAppUser(email, rawPassword, UserRole.STAFF);

        String requestBody = """
                {"email": "%s", "password": "%s"}
                """.formatted(email, rawPassword);

        mockMvc.perform(post("/api/platform/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        String email = "auth-test-wrong-password-" + System.nanoTime() + "@sifipro-test.dev";
        createAppUser(email, "CorrectPassword123!", UserRole.PLATFORM_ADMIN);

        String requestBody = """
                {"email": "%s", "password": "WrongPassword123!"}
                """.formatted(email);

        mockMvc.perform(post("/api/platform/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isUnauthorized());
    }

    private AppUser createAppUser(String email, String rawPassword, UserRole role) {
        LocalDateTime now = LocalDateTime.now();
        AppUser user = new AppUser();
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setActive(Boolean.TRUE);
        user.setTenant(null);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        AppUser saved = appUserRepository.save(user);
        createdAppUserIds.add(saved.getId());
        return saved;
    }
}
