package com.puent.sifipro.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.puent.sifipro.auth.security.JwtService;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.report.dto.ReportSummaryResponse;
import com.puent.sifipro.report.dto.TopCustomerReportEntry;
import com.puent.sifipro.report.service.ReportService;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.tenant.repository.TenantRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Proves that reports never mix tenants — the original cross-tenant leak of the old
 * /api/reports endpoints (audit P14 / ADR-08).
 *
 * Runs against a throwaway PostgreSQL 16 container (Testcontainers, requires Docker):
 * Flyway builds the real schema and the dev seeder creates two tenants, "demo" and
 * "cafe-norte", that even share a customer email. Every report figure is compared with
 * a direct SQL count restricted to one tenant.
 */
@SpringBootTest(properties = {
        // Placeholders of application-dev.properties; the datasource itself comes from the container.
        "DB_USERNAME=unused",
        "DB_PASSWORD=unused",
        "APP_JWT_SECRET=report-isolation-test-secret-0123456789-abcdefghijklmnopqrstuvwxyz"
})
@AutoConfigureMockMvc
@Import(ReportTenantIsolationIntegrationTest.PostgresContainerConfig.class)
class ReportTenantIsolationIntegrationTest {

    private static final String DEMO_STAFF = "staff@sifipro.com";
    private static final String CAFE_ADMIN = "admin@cafenorte.com";
    private static final String SHARED_CUSTOMER_EMAIL = "laura.mendoza@sifipro.dev";

    @TestConfiguration(proxyBeanMethods = false)
    static class PostgresContainerConfig {

        @Bean
        @ServiceConnection
        PostgreSQLContainer postgres() {
            return new PostgreSQLContainer("postgres:16-alpine");
        }
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ReportService reportService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private ProgramConfigRepository programConfigRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private AppUserRepository appUserRepository;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;

    private Long demoTenantId;
    private Long cafeTenantId;
    private Long demoProgramId;
    private Long cafeProgramId;

    @BeforeEach
    void resolveSeededTenants() {
        demoTenantId = tenantRepository.findByCodeIgnoreCase("demo").orElseThrow().getId();
        cafeTenantId = tenantRepository.findByCodeIgnoreCase("cafe-norte").orElseThrow().getId();
        demoProgramId = firstProgram(demoTenantId);
        cafeProgramId = firstProgram(cafeTenantId);
    }

    @Test
    void programOfAnotherTenant_isNotFound_evenThroughTheService() {
        assertThatThrownBy(() -> reportService.getSummary(demoProgramId, null, null, CAFE_ADMIN))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> reportService.getTopCustomers(demoProgramId, null, null, 10, CAFE_ADMIN))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void summary_matchesDirectSqlForEachTenant_andNeverIncludesTheOther() {
        ReportSummaryResponse cafe = reportService.getSummary(cafeProgramId, null, null, CAFE_ADMIN);
        ReportSummaryResponse demo = reportService.getSummary(demoProgramId, null, null, DEMO_STAFF);

        assertSummaryMatchesSql(cafe, cafeTenantId, cafeProgramId);
        assertSummaryMatchesSql(demo, demoTenantId, demoProgramId);

        // Customers are counted per tenant: cafe-norte never sees demo's customers.
        assertThat(cafe.totalCustomers()).isEqualTo(countWhereTenant("customers", cafeTenantId));
        assertThat(demo.totalCustomers()).isEqualTo(countWhereTenant("customers", demoTenantId));
        assertThat(cafe.totalCustomers()).isLessThan(demo.totalCustomers());
    }

    @Test
    void topCustomers_onlyContainCustomersOfTheCallerTenant() {
        List<TopCustomerReportEntry> cafeTop = reportService.getTopCustomers(cafeProgramId, null, null, 50, CAFE_ADMIN);

        assertThat(cafeTop).isNotEmpty();
        assertThat(cafeTop).allSatisfy(entry ->
                assertThat(customerRepository.findByIdAndTenantId(entry.customerId(), cafeTenantId)).isPresent());

        // The customer email exists in both tenants: cafe-norte must get its own record.
        Long cafeLauraId = jdbcTemplate.queryForObject(
                "SELECT id FROM customers WHERE tenant_id = ? AND lower(email) = ?",
                Long.class, cafeTenantId, SHARED_CUSTOMER_EMAIL);
        assertThat(cafeTop).filteredOn(entry -> entry.email().equals(SHARED_CUSTOMER_EMAIL))
                .singleElement()
                .satisfies(entry -> assertThat(entry.customerId()).isEqualTo(cafeLauraId));
    }

    @Test
    void httpEndpoint_returns404ForAnotherTenantsProgram_and200ForOwn() throws Exception {
        mockMvc.perform(get("/api/reports/summary")
                        .param("programConfigId", demoProgramId.toString())
                        .header("Authorization", bearer(CAFE_ADMIN)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/reports/summary")
                        .param("programConfigId", demoProgramId.toString())
                        .header("Authorization", bearer(DEMO_STAFF)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purchases").value(countPurchases(demoTenantId, demoProgramId)));
    }

    @Test
    void purchasesCsv_containsOnlyTheCallerTenantsRows() throws Exception {
        String csv = mockMvc.perform(get("/api/reports/export/purchases.csv")
                        .param("programConfigId", cafeProgramId.toString())
                        .header("Authorization", bearer(CAFE_ADMIN)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        List<String> dataRows = csv.lines().skip(1).filter(line -> !line.isBlank()).toList();
        assertThat(dataRows).hasSize((int) countPurchases(cafeTenantId, cafeProgramId));

        // No email of a customer that exists only in "demo" may appear.
        List<String> demoOnlyEmails = jdbcTemplate.queryForList(
                "SELECT email FROM customers d WHERE d.tenant_id = ? AND NOT EXISTS "
                        + "(SELECT 1 FROM customers c WHERE c.tenant_id = ? AND lower(c.email) = lower(d.email))",
                String.class, demoTenantId, cafeTenantId);
        assertThat(demoOnlyEmails).isNotEmpty();
        assertThat(demoOnlyEmails).allSatisfy(email -> assertThat(csv).doesNotContain(email));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void assertSummaryMatchesSql(ReportSummaryResponse summary, Long tenantId, Long programId) {
        Map<String, Object> purchases = jdbcTemplate.queryForMap(
                "SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS amount, COALESCE(SUM(points_earned), 0) AS points "
                        + "FROM purchase_transactions WHERE tenant_id = ? AND program_config_id = ?",
                tenantId, programId);
        Map<String, Object> redemptions = jdbcTemplate.queryForMap(
                "SELECT COUNT(*) AS n, COALESCE(SUM(points_used), 0) AS points "
                        + "FROM redemptions WHERE tenant_id = ? AND program_config_id = ? AND status = 'COMPLETED'",
                tenantId, programId);

        assertThat(summary.purchases()).isEqualTo(((Number) purchases.get("n")).longValue());
        assertThat(summary.totalAmount()).isEqualByComparingTo((BigDecimal) purchases.get("amount"));
        assertThat(summary.pointsIssued()).isEqualByComparingTo((BigDecimal) purchases.get("points"));
        assertThat(summary.redemptions()).isEqualTo(((Number) redemptions.get("n")).longValue());
        assertThat(summary.pointsRedeemed()).isEqualByComparingTo((BigDecimal) redemptions.get("points"));
        assertThat(summary.purchases()).isPositive();
    }

    private long countPurchases(Long tenantId, Long programId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM purchase_transactions WHERE tenant_id = ? AND program_config_id = ?",
                Long.class, tenantId, programId);
    }

    private long countWhereTenant(String table, Long tenantId) {
        // table is a constant from this test, never user input
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE tenant_id = ?", Long.class, tenantId);
    }

    private Long firstProgram(Long tenantId) {
        return programConfigRepository.findAllByTenantIdOrderByIdDesc(tenantId).stream()
                .map(ProgramConfig::getId)
                .min(Long::compare)
                .orElseThrow();
    }

    private String bearer(String email) {
        AppUser user = appUserRepository.findWithTenantByEmailIgnoreCase(email).orElseThrow();
        return "Bearer " + jwtService.generateToken(user);
    }
}
