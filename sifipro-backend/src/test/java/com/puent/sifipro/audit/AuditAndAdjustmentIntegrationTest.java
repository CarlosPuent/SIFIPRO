package com.puent.sifipro.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.puent.sifipro.auth.security.JwtService;
import com.puent.sifipro.support.PostgresTestcontainersConfig;
import com.puent.sifipro.tenant.repository.TenantRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Manual adjustments and the points audit log (RF-09) through the real HTTP layer and
 * SQL, on a throwaway PostgreSQL (Testcontainers). Shares the Spring context (and the
 * container) with ReportTenantIsolationIntegrationTest.
 */
@SpringBootTest(properties = {
        // Placeholders of application-dev.properties; the datasource itself comes from the container.
        "DB_USERNAME=unused",
        "DB_PASSWORD=unused",
        "APP_JWT_SECRET=report-isolation-test-secret-0123456789-abcdefghijklmnopqrstuvwxyz"
})
@AutoConfigureMockMvc
@Import(PostgresTestcontainersConfig.class)
class AuditAndAdjustmentIntegrationTest {

    private static final String DEMO_ADMIN = "admin@sifipro.com";
    private static final String DEMO_STAFF = "staff@sifipro.com";
    private static final String CAFE_ADMIN = "admin@cafenorte.com";

    @Autowired private MockMvc mockMvc;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private AppUserRepository appUserRepository;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;

    private Long demoTenantId;
    private Long cafeTenantId;
    private Long demoProgramId;
    private Long demoCustomerId;

    @BeforeEach
    void resolveSeededData() {
        demoTenantId = tenantRepository.findByCodeIgnoreCase("demo").orElseThrow().getId();
        cafeTenantId = tenantRepository.findByCodeIgnoreCase("cafe-norte").orElseThrow().getId();
        demoProgramId = jdbcTemplate.queryForObject(
                "SELECT MIN(id) FROM program_config WHERE tenant_id = ?", Long.class, demoTenantId);
        // A customer with enough points in that program for the negative adjustment below.
        demoCustomerId = jdbcTemplate.queryForObject(
                "SELECT customer_id FROM points_movements WHERE tenant_id = ? AND program_config_id = ? "
                        + "GROUP BY customer_id ORDER BY SUM(points) DESC LIMIT 1",
                Long.class, demoTenantId, demoProgramId);
    }

    @Test
    void staff_cannotAdjustPoints_norReadTheAuditLog() throws Exception {
        mockMvc.perform(post("/api/customers/{id}/adjustments", demoCustomerId)
                        .header("Authorization", bearer(DEMO_STAFF))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adjustmentJson("50", "Intento de STAFF")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/audit/points-movements").header("Authorization", bearer(DEMO_STAFF)))
                .andExpect(status().isForbidden());
    }

    @Test
    void emptyReason_orNegativeBeyondBalance_isRejectedWith400() throws Exception {
        mockMvc.perform(post("/api/customers/{id}/adjustments", demoCustomerId)
                        .header("Authorization", bearer(DEMO_ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adjustmentJson("10", "")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/customers/{id}/adjustments", demoCustomerId)
                        .header("Authorization", bearer(DEMO_ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adjustmentJson("-999999", "Corrección excesiva")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminAdjustments_appearInTheAuditLog_andBalanceStaysEqualToLedger() throws Exception {
        adjust(DEMO_ADMIN, "50", "Bonificación por reclamo atendido");
        adjust(DEMO_ADMIN, "-20", "Corrección de puntos duplicados");

        String json = mockMvc.perform(get("/api/audit/points-movements")
                        .param("type", "ADJUSTMENT")
                        .param("customerId", demoCustomerId.toString())
                        .header("Authorization", bearer(DEMO_ADMIN)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<String> reasons = JsonPath.read(json, "$.content[*].reason");
        List<String> authors = JsonPath.read(json, "$.content[*].registeredByEmail");
        assertThat(reasons).contains("Bonificación por reclamo atendido", "Corrección de puntos duplicados");
        assertThat(authors).containsOnly(DEMO_ADMIN);

        // Global balance equals the ledger for every customer of every tenant.
        Long mismatches = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM (
                  SELECT c.id FROM customers c LEFT JOIN points_movements m ON m.customer_id = c.id
                  GROUP BY c.id, c.points_balance
                  HAVING c.points_balance <> COALESCE(SUM(CASE WHEN m.type IN ('REDEEM','EXPIRE')
                                                              THEN -abs(m.points) ELSE m.points END), 0)
                ) x
                """, Long.class);
        assertThat(mismatches).isZero();
    }

    @Test
    void auditLog_ofOneTenant_neverShowsMovementsOfTheOther() throws Exception {
        adjust(DEMO_ADMIN, "15", "Movimiento de demo para aislamiento");

        String json = mockMvc.perform(get("/api/audit/points-movements")
                        .param("size", "100")
                        .header("Authorization", bearer(CAFE_ADMIN)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        long cafeMovements = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM points_movements WHERE tenant_id = ?", Long.class, cafeTenantId);
        assertThat(((Number) JsonPath.read(json, "$.totalElements")).longValue()).isEqualTo(cafeMovements);

        List<Integer> customerIds = JsonPath.read(json, "$.content[*].customerId");
        assertThat(customerIds).isNotEmpty().allSatisfy(id -> assertThat(jdbcTemplate.queryForObject(
                "SELECT tenant_id FROM customers WHERE id = ?", Long.class, id.longValue())).isEqualTo(cafeTenantId));
        List<String> reasons = JsonPath.read(json, "$.content[*].reason");
        assertThat(reasons).doesNotContain("Movimiento de demo para aislamiento");

        // Filtering by a customer of the other tenant only narrows: nothing is returned.
        mockMvc.perform(get("/api/audit/points-movements")
                        .param("customerId", demoCustomerId.toString())
                        .header("Authorization", bearer(CAFE_ADMIN)))
                .andExpect(status().isOk())
                .andExpect(result -> assertThat(((Number) JsonPath.read(
                        result.getResponse().getContentAsString(), "$.totalElements")).longValue()).isZero());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void adjust(String email, String points, String reason) throws Exception {
        String json = mockMvc.perform(post("/api/customers/{id}/adjustments", demoCustomerId)
                        .header("Authorization", bearer(email))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adjustmentJson(points, reason)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Map<String, Object> response = JsonPath.read(json, "$");
        assertThat(new BigDecimal(response.get("points").toString())).isEqualByComparingTo(points);
    }

    private String adjustmentJson(String points, String reason) {
        return """
                {"programConfigId": %d, "points": %s, "reason": "%s"}
                """.formatted(demoProgramId, points, reason);
    }

    private String bearer(String email) {
        AppUser user = appUserRepository.findWithTenantByEmailIgnoreCase(email).orElseThrow();
        return "Bearer " + jwtService.generateToken(user);
    }
}
