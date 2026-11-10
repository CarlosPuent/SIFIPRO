package com.puent.sifipro.platform.metrics;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Platform-wide report for the SIFIPRO team (PLATFORM_ADMIN only, via SecurityConfig's
 * /api/platform/** rule): adoption and activity of every merchant on the platform.
 *
 * Read-only aggregates over the shared schema. Only counts and totals per tenant are
 * exposed, never a merchant's individual customers or transactions.
 */
@RestController
@RequestMapping("/api/platform/metrics")
public class PlatformMetricsController {

    private static final int MONTHS = 6;

    public record TenantActivity(
            Long id,
            String name,
            String code,
            boolean active,
            LocalDateTime createdAt,
            long users,
            long programs,
            long customers,
            long purchases,
            BigDecimal salesAmount,
            BigDecimal pointsIssued,
            long redemptions,
            LocalDateTime lastPurchaseAt) {
    }

    public record MonthlyActivity(String month, long purchases, BigDecimal salesAmount, long newCustomers) {
    }

    public record Totals(
            long tenants,
            long activeTenants,
            long suspendedTenants,
            long customers,
            long purchases,
            BigDecimal salesAmount,
            BigDecimal pointsIssued,
            long redemptions) {
    }

    public record PlatformMetricsResponse(
            LocalDateTime generatedAt, Totals totals, List<MonthlyActivity> monthly, List<TenantActivity> tenants) {
    }

    private final JdbcTemplate jdbcTemplate;

    public PlatformMetricsController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<PlatformMetricsResponse> getMetrics() {
        List<TenantActivity> tenants = jdbcTemplate.query("""
                SELECT t.id, t.name, t.code, t.active, t.created_at,
                       (SELECT count(*) FROM app_users u WHERE u.tenant_id = t.id)             AS users,
                       (SELECT count(*) FROM program_config p WHERE p.tenant_id = t.id)        AS programs,
                       (SELECT count(*) FROM customers c WHERE c.tenant_id = t.id)             AS customers,
                       (SELECT count(*) FROM purchase_transactions pt WHERE pt.tenant_id = t.id) AS purchases,
                       (SELECT coalesce(sum(pt.amount), 0) FROM purchase_transactions pt
                         WHERE pt.tenant_id = t.id)                                           AS sales_amount,
                       (SELECT coalesce(sum(pm.points), 0) FROM points_movements pm
                         WHERE pm.tenant_id = t.id AND pm.type = 'EARN')                      AS points_issued,
                       (SELECT count(*) FROM redemptions r WHERE r.tenant_id = t.id)           AS redemptions,
                       (SELECT max(pt.transaction_date) FROM purchase_transactions pt
                         WHERE pt.tenant_id = t.id)                                           AS last_purchase_at
                FROM tenants t
                ORDER BY sales_amount DESC, t.id
                """,
                (rs, i) -> new TenantActivity(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("code"),
                        rs.getBoolean("active"),
                        toDateTime(rs.getTimestamp("created_at")),
                        rs.getLong("users"),
                        rs.getLong("programs"),
                        rs.getLong("customers"),
                        rs.getLong("purchases"),
                        rs.getBigDecimal("sales_amount"),
                        rs.getBigDecimal("points_issued"),
                        rs.getLong("redemptions"),
                        toDateTime(rs.getTimestamp("last_purchase_at"))));

        YearMonth current = YearMonth.now();
        LocalDate since = current.minusMonths(MONTHS - 1L).atDay(1);
        Map<YearMonth, long[]> counts = new HashMap<>();
        Map<YearMonth, BigDecimal> amounts = new HashMap<>();
        jdbcTemplate.query("""
                SELECT date_trunc('month', transaction_date)::date AS month, count(*) AS purchases,
                       coalesce(sum(amount), 0) AS amount
                FROM purchase_transactions
                WHERE transaction_date >= ?
                GROUP BY 1
                """,
                rs -> {
                    YearMonth month = YearMonth.from(rs.getDate("month").toLocalDate());
                    counts.computeIfAbsent(month, m -> new long[2])[0] = rs.getLong("purchases");
                    amounts.put(month, rs.getBigDecimal("amount"));
                },
                Date.valueOf(since));
        jdbcTemplate.query("""
                SELECT date_trunc('month', created_at)::date AS month, count(*) AS customers
                FROM customers
                WHERE created_at >= ?
                GROUP BY 1
                """,
                rs -> {
                    YearMonth month = YearMonth.from(rs.getDate("month").toLocalDate());
                    counts.computeIfAbsent(month, m -> new long[2])[1] = rs.getLong("customers");
                },
                Date.valueOf(since));

        List<MonthlyActivity> monthly = new ArrayList<>();
        for (int i = MONTHS - 1; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            long[] values = counts.getOrDefault(month, new long[2]);
            monthly.add(new MonthlyActivity(month.toString(), values[0],
                    amounts.getOrDefault(month, BigDecimal.ZERO), values[1]));
        }

        long active = tenants.stream().filter(TenantActivity::active).count();
        Totals totals = new Totals(
                tenants.size(),
                active,
                tenants.size() - active,
                tenants.stream().mapToLong(TenantActivity::customers).sum(),
                tenants.stream().mapToLong(TenantActivity::purchases).sum(),
                tenants.stream().map(TenantActivity::salesAmount).reduce(BigDecimal.ZERO, BigDecimal::add),
                tenants.stream().map(TenantActivity::pointsIssued).reduce(BigDecimal.ZERO, BigDecimal::add),
                tenants.stream().mapToLong(TenantActivity::redemptions).sum());

        return ResponseEntity.ok(new PlatformMetricsResponse(LocalDateTime.now(), totals, monthly, tenants));
    }

    private static LocalDateTime toDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
