package com.puent.sifipro.report.repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import com.puent.sifipro.report.dto.RecentActivityResponse.RecentRedemption;
import com.puent.sifipro.report.dto.RecentActivityResponse.RecentTransaction;
import com.puent.sifipro.report.dto.ReportGranularity;
import com.puent.sifipro.report.dto.StockAlertEntry;
import com.puent.sifipro.report.dto.TierDistributionEntry;
import com.puent.sifipro.report.dto.TopCustomerReportEntry;
import com.puent.sifipro.report.dto.TopRewardReportEntry;
import com.puent.sifipro.report.service.ReportScope;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Aggregate report queries. Everything is computed by PostgreSQL (COUNT/SUM/GROUP BY),
 * so no entity lists are loaded into memory.
 *
 * Tenant isolation: every statement filters by {@code tenant_id = :tenantId} (and by
 * {@code program_config_id} where the data is program-scoped), with values taken from
 * a {@link ReportScope} built from the authenticated user. Joined tables are also
 * constrained to the same tenant. Column names spliced into SQL are constants, never
 * request input; all request values travel as bind parameters.
 */
@Repository
public class ReportQueryRepository {

    private static final String COMPLETED = "COMPLETED";

    private final NamedParameterJdbcTemplate jdbc;

    public ReportQueryRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record PurchaseTotals(long purchases, BigDecimal amount, BigDecimal pointsIssued, long purchasingCustomers) {
    }

    public record RedemptionTotals(long redemptions, BigDecimal pointsRedeemed) {
    }

    public record CustomerTotals(long total, long active, long created) {
    }

    public record RewardTotals(long total, long active) {
    }

    public record PeriodPurchases(LocalDate period, long purchases, BigDecimal amount, BigDecimal pointsIssued) {
    }

    public record PeriodRedemptions(LocalDate period, long redemptions, BigDecimal pointsRedeemed) {
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    public PurchaseTotals purchaseTotals(ReportScope scope) {
        MapSqlParameterSource params = programParams(scope);
        String sql = """
                SELECT COUNT(*) AS purchases,
                       COALESCE(SUM(pt.amount), 0) AS amount,
                       COALESCE(SUM(pt.points_earned), 0) AS points_issued,
                       COUNT(DISTINCT pt.customer_id) AS purchasing_customers
                FROM purchase_transactions pt
                WHERE pt.tenant_id = :tenantId AND pt.program_config_id = :programConfigId
                """ + dateRange("pt.transaction_date", scope, params);
        return jdbc.queryForObject(sql, params, (rs, i) -> new PurchaseTotals(
                rs.getLong("purchases"), rs.getBigDecimal("amount"),
                rs.getBigDecimal("points_issued"), rs.getLong("purchasing_customers")));
    }

    public RedemptionTotals redemptionTotals(ReportScope scope) {
        MapSqlParameterSource params = programParams(scope).addValue("status", COMPLETED);
        String sql = """
                SELECT COUNT(*) AS redemptions, COALESCE(SUM(r.points_used), 0) AS points_redeemed
                FROM redemptions r
                WHERE r.tenant_id = :tenantId AND r.program_config_id = :programConfigId AND r.status = :status
                """ + dateRange("r.redemption_date", scope, params);
        return jdbc.queryForObject(sql, params, (rs, i) -> new RedemptionTotals(
                rs.getLong("redemptions"), rs.getBigDecimal("points_redeemed")));
    }

    /** Customers are tenant-scoped (not per program). "created" counts creations within the range. */
    public CustomerTotals customerTotals(ReportScope scope) {
        MapSqlParameterSource params = new MapSqlParameterSource("tenantId", scope.tenantId());
        String createdFilter = dateRange("c.created_at", scope, params);
        String createdExpression = createdFilter.isEmpty()
                ? "COUNT(*)"
                : "COUNT(*) FILTER (WHERE TRUE" + createdFilter + ")";
        String sql = "SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE c.active) AS active, "
                + createdExpression + " AS created FROM customers c WHERE c.tenant_id = :tenantId";
        return jdbc.queryForObject(sql, params, (rs, i) -> new CustomerTotals(
                rs.getLong("total"), rs.getLong("active"), rs.getLong("created")));
    }

    public RewardTotals rewardTotals(ReportScope scope) {
        String sql = """
                SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE rw.active) AS active
                FROM rewards rw
                WHERE rw.tenant_id = :tenantId AND rw.program_config_id = :programConfigId
                """;
        return jdbc.queryForObject(sql, programParams(scope), (rs, i) -> new RewardTotals(
                rs.getLong("total"), rs.getLong("active")));
    }

    // ── Time series ───────────────────────────────────────────────────────────

    public List<PeriodPurchases> purchasesByPeriod(ReportScope scope, ReportGranularity granularity) {
        MapSqlParameterSource params = programParams(scope);
        String sql = "SELECT date_trunc('" + truncUnit(granularity) + "', pt.transaction_date) AS period, "
                + "COUNT(*) AS purchases, COALESCE(SUM(pt.amount), 0) AS amount, "
                + "COALESCE(SUM(pt.points_earned), 0) AS points_issued "
                + "FROM purchase_transactions pt "
                + "WHERE pt.tenant_id = :tenantId AND pt.program_config_id = :programConfigId"
                + dateRange("pt.transaction_date", scope, params)
                + " GROUP BY 1 ORDER BY 1";
        return jdbc.query(sql, params, (rs, i) -> new PeriodPurchases(
                period(rs), rs.getLong("purchases"), rs.getBigDecimal("amount"), rs.getBigDecimal("points_issued")));
    }

    public List<PeriodRedemptions> redemptionsByPeriod(ReportScope scope, ReportGranularity granularity) {
        MapSqlParameterSource params = programParams(scope).addValue("status", COMPLETED);
        String sql = "SELECT date_trunc('" + truncUnit(granularity) + "', r.redemption_date) AS period, "
                + "COUNT(*) AS redemptions, COALESCE(SUM(r.points_used), 0) AS points_redeemed "
                + "FROM redemptions r "
                + "WHERE r.tenant_id = :tenantId AND r.program_config_id = :programConfigId AND r.status = :status"
                + dateRange("r.redemption_date", scope, params)
                + " GROUP BY 1 ORDER BY 1";
        return jdbc.query(sql, params, (rs, i) -> new PeriodRedemptions(
                period(rs), rs.getLong("redemptions"), rs.getBigDecimal("points_redeemed")));
    }

    // ── Rankings ──────────────────────────────────────────────────────────────

    public List<TopCustomerReportEntry> topCustomers(ReportScope scope, int limit) {
        MapSqlParameterSource params = programParams(scope).addValue("limit", limit).addValue("status", COMPLETED);
        String purchaseRange = dateRange("pt.transaction_date", scope, params);
        String redemptionRange = dateRange("r.redemption_date", scope, params);
        String sql = "SELECT c.id, c.first_name, c.last_name, c.email, c.active, c.points_balance, "
                + "COUNT(pt.id) AS purchases, COALESCE(SUM(pt.amount), 0) AS amount, "
                + "COALESCE(SUM(pt.points_earned), 0) AS points_earned, "
                + "(SELECT COUNT(*) FROM redemptions r WHERE r.customer_id = c.id AND r.tenant_id = :tenantId "
                + "AND r.program_config_id = :programConfigId AND r.status = :status" + redemptionRange + ") AS redemptions "
                + "FROM purchase_transactions pt "
                + "JOIN customers c ON c.id = pt.customer_id AND c.tenant_id = :tenantId "
                + "WHERE pt.tenant_id = :tenantId AND pt.program_config_id = :programConfigId" + purchaseRange
                + " GROUP BY c.id, c.first_name, c.last_name, c.email, c.active, c.points_balance"
                + " ORDER BY points_earned DESC, amount DESC, c.id LIMIT :limit";
        return jdbc.query(sql, params, (rs, i) -> new TopCustomerReportEntry(
                rs.getLong("id"),
                (rs.getString("first_name") + " " + rs.getString("last_name")).trim(),
                rs.getString("email"),
                rs.getBoolean("active"),
                rs.getLong("purchases"),
                rs.getBigDecimal("amount"),
                rs.getBigDecimal("points_earned"),
                rs.getLong("redemptions"),
                rs.getBigDecimal("points_balance")));
    }

    public List<TopRewardReportEntry> topRewards(ReportScope scope, int limit) {
        MapSqlParameterSource params = programParams(scope).addValue("limit", limit).addValue("status", COMPLETED);
        String sql = "SELECT rw.id, rw.name, rw.stock, COUNT(r.id) AS redemptions, "
                + "COALESCE(SUM(r.points_used), 0) AS points_redeemed "
                + "FROM redemptions r "
                + "JOIN rewards rw ON rw.id = r.reward_id AND rw.tenant_id = :tenantId "
                + "WHERE r.tenant_id = :tenantId AND r.program_config_id = :programConfigId AND r.status = :status"
                + dateRange("r.redemption_date", scope, params)
                + " GROUP BY rw.id, rw.name, rw.stock ORDER BY redemptions DESC, points_redeemed DESC, rw.name LIMIT :limit";
        return jdbc.query(sql, params, (rs, i) -> new TopRewardReportEntry(
                rs.getLong("id"), rs.getString("name"), rs.getLong("redemptions"),
                rs.getBigDecimal("points_redeemed"), rs.getInt("stock")));
    }

    /** Tenant-wide: tiers depend on the current global balance, not on a program or period. */
    public List<TierDistributionEntry> tierDistribution(Long tenantId, BigDecimal silverThreshold, BigDecimal goldThreshold) {
        MapSqlParameterSource params = new MapSqlParameterSource("tenantId", tenantId)
                .addValue("silver", silverThreshold)
                .addValue("gold", goldThreshold);
        String sql = """
                SELECT CASE WHEN c.points_balance >= :gold THEN 'GOLD'
                            WHEN c.points_balance >= :silver THEN 'SILVER'
                            ELSE 'BRONZE' END AS tier,
                       COUNT(*) AS customers,
                       COALESCE(SUM(c.points_balance), 0) AS total_points
                FROM customers c
                WHERE c.tenant_id = :tenantId
                GROUP BY 1
                """;
        return jdbc.query(sql, params, (rs, i) -> new TierDistributionEntry(
                rs.getString("tier"), rs.getLong("customers"), rs.getBigDecimal("total_points")));
    }

    public List<StockAlertEntry> stockAlerts(ReportScope scope, int threshold, int limit) {
        MapSqlParameterSource params = programParams(scope).addValue("threshold", threshold).addValue("limit", limit);
        String sql = """
                SELECT rw.id, rw.name, rw.stock, rw.required_points
                FROM rewards rw
                WHERE rw.tenant_id = :tenantId AND rw.program_config_id = :programConfigId
                  AND rw.active AND rw.stock <= :threshold
                ORDER BY rw.stock ASC, rw.name
                LIMIT :limit
                """;
        return jdbc.query(sql, params, (rs, i) -> {
            int stock = rs.getInt("stock");
            return new StockAlertEntry(rs.getLong("id"), rs.getString("name"), stock,
                    rs.getBigDecimal("required_points"), stock == 0 ? "OUT_OF_STOCK" : "LOW_STOCK");
        });
    }

    // ── Recent activity (Dashboard) ───────────────────────────────────────────

    public List<RecentTransaction> recentTransactions(ReportScope scope, int limit) {
        String sql = """
                SELECT pt.id, c.first_name, c.last_name, pt.amount, pt.points_earned, pt.transaction_date
                FROM purchase_transactions pt
                JOIN customers c ON c.id = pt.customer_id AND c.tenant_id = :tenantId
                WHERE pt.tenant_id = :tenantId AND pt.program_config_id = :programConfigId
                ORDER BY pt.transaction_date DESC, pt.id DESC
                LIMIT :limit
                """;
        return jdbc.query(sql, programParams(scope).addValue("limit", limit), (rs, i) -> new RecentTransaction(
                rs.getLong("id"), fullName(rs), rs.getBigDecimal("amount"), rs.getBigDecimal("points_earned"),
                rs.getTimestamp("transaction_date").toLocalDateTime()));
    }

    public List<RecentRedemption> recentRedemptions(ReportScope scope, int limit) {
        String sql = """
                SELECT r.id, c.first_name, c.last_name, rw.name AS reward_name, r.points_used, r.redemption_date
                FROM redemptions r
                JOIN customers c ON c.id = r.customer_id AND c.tenant_id = :tenantId
                JOIN rewards rw ON rw.id = r.reward_id AND rw.tenant_id = :tenantId
                WHERE r.tenant_id = :tenantId AND r.program_config_id = :programConfigId
                ORDER BY r.redemption_date DESC, r.id DESC
                LIMIT :limit
                """;
        return jdbc.query(sql, programParams(scope).addValue("limit", limit), (rs, i) -> new RecentRedemption(
                rs.getLong("id"), fullName(rs), rs.getString("reward_name"), rs.getBigDecimal("points_used"),
                rs.getTimestamp("redemption_date").toLocalDateTime()));
    }

    // ── CSV export ────────────────────────────────────────────────────────────

    /** Streams the purchases of the scope row by row (no list is built in memory). */
    public void streamPurchases(ReportScope scope, RowCallbackHandler rowHandler) {
        MapSqlParameterSource params = programParams(scope);
        String sql = "SELECT pt.id, pt.transaction_date, c.first_name, c.last_name, c.email, pt.amount, "
                + "pt.points_earned, pt.description, u.email AS registered_by "
                + "FROM purchase_transactions pt "
                + "JOIN customers c ON c.id = pt.customer_id AND c.tenant_id = :tenantId "
                + "LEFT JOIN app_users u ON u.id = pt.created_by "
                + "WHERE pt.tenant_id = :tenantId AND pt.program_config_id = :programConfigId"
                + dateRange("pt.transaction_date", scope, params)
                + " ORDER BY pt.transaction_date, pt.id";
        jdbc.query(sql, params, rowHandler);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static MapSqlParameterSource programParams(ReportScope scope) {
        return new MapSqlParameterSource()
                .addValue("tenantId", scope.tenantId())
                .addValue("programConfigId", scope.programConfigId());
    }

    /** Appends the optional date bounds for {@code column} (a constant) and binds their values. */
    private static String dateRange(String column, ReportScope scope, MapSqlParameterSource params) {
        StringBuilder sql = new StringBuilder();
        if (scope.fromInclusive() != null) {
            sql.append(" AND ").append(column).append(" >= :fromTs");
            params.addValue("fromTs", scope.fromInclusive());
        }
        if (scope.toExclusive() != null) {
            sql.append(" AND ").append(column).append(" < :toTs");
            params.addValue("toTs", scope.toExclusive());
        }
        return sql.toString();
    }

    private static String truncUnit(ReportGranularity granularity) {
        return granularity == ReportGranularity.MONTH ? "month" : "day";
    }

    private static LocalDate period(ResultSet rs) throws SQLException {
        return rs.getTimestamp("period").toLocalDateTime().toLocalDate();
    }

    private static String fullName(ResultSet rs) throws SQLException {
        return (rs.getString("first_name") + " " + rs.getString("last_name")).trim();
    }
}
