package com.puent.sifipro.platform.tenant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.puent.sifipro.platform.auth.security.JwtService;
import com.puent.sifipro.platform.tenant.entity.Tenant;
import com.puent.sifipro.platform.tenant.repository.TenantRepository;
import com.puent.sifipro.platform.user.entity.AppUser;
import com.puent.sifipro.platform.user.entity.UserRole;
import com.puent.sifipro.platform.user.repository.AppUserRepository;

/**
 * Exercises TenantController through the real HTTP layer (MockMvc + full
 * SecurityFilterChain) against the real dev database — no repository mocks, same
 * approach as sifipro-backend's RedemptionConcurrencyIntegrationTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TenantControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final List<Long> createdAppUserIds = new ArrayList<>();
    private final List<Long> createdTenantIds = new ArrayList<>();

    private String platformAdminToken;

    @BeforeEach
    void setUp() {
        AppUser platformAdmin = createAppUser(
                "platform-admin-test-" + System.nanoTime() + "@sifipro-test.dev",
                "PlatformTest123!",
                UserRole.PLATFORM_ADMIN,
                null);
        platformAdminToken = jwtService.generateToken(platformAdmin);
    }

    @AfterEach
    void cleanUpTestData() {
        // Delete app_users before tenants: app_users.tenant_id is a foreign key.
        createdAppUserIds.forEach(appUserRepository::deleteById);
        createdTenantIds.forEach(tenantRepository::deleteById);
        createdAppUserIds.clear();
        createdTenantIds.clear();
    }

    @Test
    void createTenant_withValidPlatformAdmin_persistsTenantAndAdminUser() throws Exception {
        String code = "e2e-create-" + System.nanoTime();
        String adminEmail = "admin-" + System.nanoTime() + "@sifipro-test.dev";

        String requestBody = """
                {
                  "name": "Integration Test Tenant",
                  "code": "%s",
                  "adminFirstName": "Test",
                  "adminLastName": "Admin",
                  "adminEmail": "%s",
                  "adminPassword": "TestAdmin123!"
                }
                """.formatted(code, adminEmail);

        mockMvc.perform(post("/api/platform/tenants")
                        .header("Authorization", "Bearer " + platformAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(jsonPath("$.name").value("Integration Test Tenant"))
                .andExpect(jsonPath("$.active").value(true));

        Tenant persistedTenant = findTenantByCode(code);
        createdTenantIds.add(persistedTenant.getId());
        assertThat(persistedTenant.getName()).isEqualTo("Integration Test Tenant");
        assertThat(persistedTenant.getActive()).isTrue();
        assertThat(persistedTenant.getCreatedAt()).isNotNull();

        AppUser persistedAdmin = appUserRepository.findByEmailIgnoreCase(adminEmail).orElseThrow();
        createdAppUserIds.add(persistedAdmin.getId());
        assertThat(persistedAdmin.getFirstName()).isEqualTo("Test");
        assertThat(persistedAdmin.getLastName()).isEqualTo("Admin");
        assertThat(persistedAdmin.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(persistedAdmin.getActive()).isTrue();
        assertThat(persistedAdmin.getTenant()).isNotNull();
        assertThat(persistedAdmin.getTenant().getId()).isEqualTo(persistedTenant.getId());
        assertThat(passwordEncoder.matches("TestAdmin123!", persistedAdmin.getPasswordHash())).isTrue();
    }

    @Test
    void createTenant_withDuplicateCode_returns409() throws Exception {
        String code = "dup-code-" + System.nanoTime();
        createTenantDirectly(code);

        String adminEmail = "admin-dup-code-" + System.nanoTime() + "@sifipro-test.dev";
        String requestBody = """
                {
                  "name": "Another Tenant",
                  "code": "%s",
                  "adminFirstName": "Test",
                  "adminLastName": "Admin",
                  "adminEmail": "%s",
                  "adminPassword": "TestAdmin123!"
                }
                """.formatted(code, adminEmail);

        mockMvc.perform(post("/api/platform/tenants")
                        .header("Authorization", "Bearer " + platformAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict());

        assertThat(appUserRepository.existsByEmailIgnoreCase(adminEmail))
                .as("no admin user should be created when the tenant code conflict rejects the request")
                .isFalse();
    }

    @Test
    void createTenant_withDuplicateAdminEmail_returns409() throws Exception {
        String existingEmail = "existing-admin-" + System.nanoTime() + "@sifipro-test.dev";
        Tenant existingTenant = createTenantDirectly("existing-owner-" + System.nanoTime());
        createAppUser(existingEmail, "Existing123!", UserRole.ADMIN, existingTenant);

        String newCode = "new-code-" + System.nanoTime();
        String requestBody = """
                {
                  "name": "Conflicting Admin Tenant",
                  "code": "%s",
                  "adminFirstName": "Test",
                  "adminLastName": "Admin",
                  "adminEmail": "%s",
                  "adminPassword": "TestAdmin123!"
                }
                """.formatted(newCode, existingEmail);

        mockMvc.perform(post("/api/platform/tenants")
                        .header("Authorization", "Bearer " + platformAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict());

        assertThat(tenantRepository.existsByCodeIgnoreCase(newCode))
                .as("no tenant should be created when the admin email conflict rejects the request")
                .isFalse();
    }

    @Test
    void createTenant_withoutAuthentication_returns401() throws Exception {
        String code = "no-auth-" + System.nanoTime();
        String requestBody = """
                {
                  "name": "Should Not Be Created",
                  "code": "%s",
                  "adminFirstName": "Test",
                  "adminLastName": "Admin",
                  "adminEmail": "no-auth-%s@sifipro-test.dev",
                  "adminPassword": "TestAdmin123!"
                }
                """.formatted(code, System.nanoTime());

        mockMvc.perform(post("/api/platform/tenants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isUnauthorized());

        assertThat(tenantRepository.existsByCodeIgnoreCase(code)).isFalse();
    }

    @Test
    void deactivateTenant_thenGetById_reflectsInactiveStatus() throws Exception {
        Tenant tenant = createTenantDirectly("deactivate-test-" + System.nanoTime());

        mockMvc.perform(patch("/api/platform/tenants/{id}/deactivate", tenant.getId())
                        .header("Authorization", "Bearer " + platformAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/api/platform/tenants/{id}", tenant.getId())
                        .header("Authorization", "Bearer " + platformAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        Tenant reloaded = tenantRepository.findById(tenant.getId()).orElseThrow();
        assertThat(reloaded.getActive()).isFalse();
    }

    private Tenant findTenantByCode(String code) {
        return tenantRepository.findAll().stream()
                .filter(t -> t.getCode().equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Tenant with code " + code + " was not persisted."));
    }

    private Tenant createTenantDirectly(String code) {
        LocalDateTime now = LocalDateTime.now();
        Tenant tenant = new Tenant();
        tenant.setName("Direct Tenant " + code);
        tenant.setCode(code);
        tenant.setActive(Boolean.TRUE);
        tenant.setCreatedAt(now);
        tenant.setUpdatedAt(now);
        Tenant saved = tenantRepository.save(tenant);
        createdTenantIds.add(saved.getId());
        return saved;
    }

    private AppUser createAppUser(String email, String rawPassword, UserRole role, Tenant tenant) {
        LocalDateTime now = LocalDateTime.now();
        AppUser user = new AppUser();
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setActive(Boolean.TRUE);
        user.setTenant(tenant);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        AppUser saved = appUserRepository.save(user);
        createdAppUserIds.add(saved.getId());
        return saved;
    }
}
