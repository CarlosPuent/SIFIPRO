package com.puent.sifipro.portal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.jayway.jsonpath.JsonPath;
import com.puent.sifipro.auth.security.JwtService;
import com.puent.sifipro.support.PostgresTestcontainersConfig;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Avance final: customer portal (RF-08), sign-in by subdomain (RF-01) and the PDF report,
 * through the real HTTP layer on a throwaway PostgreSQL (Testcontainers) seeded with the
 * demo data. Shares the Spring context and container with the other integration tests.
 */
@SpringBootTest(properties = {
        "DB_USERNAME=unused",
        "DB_PASSWORD=unused",
        "APP_JWT_SECRET=report-isolation-test-secret-0123456789-abcdefghijklmnopqrstuvwxyz"
})
@AutoConfigureMockMvc
@Import(PostgresTestcontainersConfig.class)
class CustomerPortalIntegrationTest {

    private static final String PORTAL_EMAIL = "laura.mendoza@sifipro.dev";
    private static final String PORTAL_PASSWORD = "Cliente123!";

    @Autowired private MockMvc mockMvc;
    @Autowired private AppUserRepository appUserRepository;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    void sameEmailInTwoTenants_subdomainDecidesWhichCustomerSignsIn() throws Exception {
        String demoToken = portalLogin("demo");
        String cafeToken = portalLogin("cafe-norte");

        String demoMe = getJson("/api/portal/me", demoToken);
        String cafeMe = getJson("/api/portal/me", cafeToken);

        assertThat((String) JsonPath.read(demoMe, "$.tenant.code")).isEqualTo("demo");
        assertThat((String) JsonPath.read(cafeMe, "$.tenant.code")).isEqualTo("cafe-norte");
        assertThat(((Number) JsonPath.read(demoMe, "$.id")).longValue())
                .isNotEqualTo(((Number) JsonPath.read(cafeMe, "$.id")).longValue());

        // The portal balance is the customer's real balance in that tenant.
        BigDecimal dbBalance = jdbcTemplate.queryForObject(
                "SELECT c.points_balance FROM customers c JOIN tenants t ON t.id = c.tenant_id "
                        + "WHERE t.code = 'demo' AND c.email = ?", BigDecimal.class, PORTAL_EMAIL);
        assertThat(new BigDecimal(JsonPath.read(demoMe, "$.pointsBalance").toString()))
                .isEqualByComparingTo(dbBalance);
    }

    @Test
    void movementsAndRewards_belongOnlyToTheSignedInCustomer() throws Exception {
        String token = portalLogin("demo");
        Long customerId = jdbcTemplate.queryForObject(
                "SELECT c.id FROM customers c JOIN tenants t ON t.id = c.tenant_id "
                        + "WHERE t.code = 'demo' AND c.email = ?", Long.class, PORTAL_EMAIL);

        List<Integer> movementIds = JsonPath.read(getJson("/api/portal/movements", token), "$[*].id");
        assertThat(movementIds).isNotEmpty();
        String ids = movementIds.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(","));
        Long foreign = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM points_movements WHERE id IN (" + ids + ") AND customer_id <> ?",
                Long.class, customerId);
        assertThat(foreign).isZero();

        List<String> rewardPrograms = JsonPath.read(getJson("/api/portal/rewards", token), "$[*].programName");
        assertThat(rewardPrograms).isNotEmpty().doesNotContain("Club Café del Norte");
    }

    @Test
    void customerTokens_neverReachStaffEndpoints_andStaffTokens_neverReachThePortal() throws Exception {
        String customerToken = portalLogin("demo");
        mockMvc.perform(get("/api/customers").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/portal/me").header("Authorization", staffBearer("admin@sifipro.com")))
                .andExpect(status().isForbidden());
    }

    @Test
    void wrongPassword_orCustomerWithoutAccess_isRejected() throws Exception {
        mockMvc.perform(post("/api/portal/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("demo", PORTAL_EMAIL, "Incorrecta123!")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid credentials."));

        String withoutAccess = jdbcTemplate.queryForObject(
                "SELECT c.email FROM customers c JOIN tenants t ON t.id = c.tenant_id "
                        + "WHERE t.code = 'demo' AND c.portal_password_hash IS NULL LIMIT 1", String.class);
        mockMvc.perform(post("/api/portal/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("demo", withoutAccess, PORTAL_PASSWORD)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void revokingAccess_cutsTheIssuedToken_andGrantingRestoresIt() throws Exception {
        String token = portalLogin("demo");
        Long customerId = jdbcTemplate.queryForObject(
                "SELECT c.id FROM customers c JOIN tenants t ON t.id = c.tenant_id "
                        + "WHERE t.code = 'demo' AND c.email = ?", Long.class, PORTAL_EMAIL);

        // STAFF cannot manage portal access.
        mockMvc.perform(delete("/api/customers/{id}/portal-access", customerId)
                        .header("Authorization", staffBearer("staff@sifipro.com")))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/customers/{id}/portal-access", customerId)
                        .header("Authorization", staffBearer("admin@sifipro.com")))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/portal/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.details[0]").value("CUSTOMER_INACTIVE"));

        mockMvc.perform(put("/api/customers/{id}/portal-access", customerId)
                        .header("Authorization", staffBearer("admin@sifipro.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"" + PORTAL_PASSWORD + "\"}"))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/portal/me").header("Authorization", "Bearer " + portalLogin("demo")))
                .andExpect(status().isOk());
    }

    @Test
    void staffLoginFromASubdomain_onlyAdmitsThatTenantsUsers() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@sifipro.com\",\"password\":\"Admin123!\",\"tenantCode\":\"cafe-norte\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@sifipro.com\",\"password\":\"Admin123!\",\"tenantCode\":\"demo\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/public/tenants/{code}", "cafe-norte"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Café del Norte"));
        mockMvc.perform(get("/api/public/tenants/{code}", "no-existe"))
                .andExpect(status().isNotFound());
    }

    @Test
    void pdfReport_isARealPdf_andIsolatedByTenant() throws Exception {
        Long demoProgram = jdbcTemplate.queryForObject(
                "SELECT MIN(p.id) FROM program_config p JOIN tenants t ON t.id = p.tenant_id WHERE t.code = 'demo'",
                Long.class);

        MvcResult result = mockMvc.perform(get("/api/reports/export/report.pdf")
                        .param("programConfigId", demoProgram.toString())
                        .header("Authorization", staffBearer("admin@sifipro.com")))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentType()).startsWith("application/pdf");
        byte[] pdf = result.getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");

        mockMvc.perform(get("/api/reports/export/report.pdf")
                        .param("programConfigId", demoProgram.toString())
                        .header("Authorization", staffBearer("admin@cafenorte.com")))
                .andExpect(status().isNotFound());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String portalLogin(String tenantCode) throws Exception {
        String json = mockMvc.perform(post("/api/portal/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(tenantCode, PORTAL_EMAIL, PORTAL_PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.accessToken");
    }

    private String getJson(String path, String token) throws Exception {
        return mockMvc.perform(get(path).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private String staffBearer(String email) {
        return "Bearer " + jwtService.generateToken(appUserRepository.findWithTenantByEmailIgnoreCase(email).orElseThrow());
    }

    private static String loginJson(String tenantCode, String email, String password) {
        return "{\"tenantCode\":\"" + tenantCode + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }
}
