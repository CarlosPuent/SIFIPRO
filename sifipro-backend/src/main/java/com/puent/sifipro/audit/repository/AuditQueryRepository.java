package com.puent.sifipro.audit.repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import com.puent.sifipro.audit.dto.AuditMovementEntry;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Paginated read of the points ledger for the audit log.
 *
 * Tenant isolation: the base condition is {@code m.tenant_id = :tenantId} with the
 * authenticated user's tenant, and every joined table is constrained to the same
 * tenant, so optional filters (customer, user) can only narrow the result — an id
 * that belongs to another tenant simply matches nothing.
 */
@Repository
public class AuditQueryRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public AuditQueryRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record AuditFilter(
            Long tenantId,
            LocalDate from,
            LocalDate to,
            PointsMovementType type,
            Long customerId,
            Long userId) {
    }

    public long count(AuditFilter filter) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String sql = "SELECT COUNT(*) FROM points_movements m WHERE " + where(filter, params);
        Long total = jdbc.queryForObject(sql, params, Long.class);
        return total == null ? 0 : total;
    }

    public List<AuditMovementEntry> findPage(AuditFilter filter, int page, int size) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("limit", size)
                .addValue("offset", (long) page * size);
        String sql = """
                SELECT m.id, m.created_at, m.type, m.points, m.reference_type, m.reference_id,
                       m.reason, m.description,
                       c.id AS customer_id, c.first_name, c.last_name, c.email,
                       p.id AS program_id, p.program_name,
                       u.id AS user_id, u.first_name AS user_first_name, u.last_name AS user_last_name,
                       u.email AS user_email,
                       pt.amount AS purchase_amount, rw.name AS reward_name
                FROM points_movements m
                JOIN customers c ON c.id = m.customer_id AND c.tenant_id = :tenantId
                JOIN program_config p ON p.id = m.program_config_id AND p.tenant_id = :tenantId
                LEFT JOIN app_users u ON u.id = m.created_by AND u.tenant_id = :tenantId
                LEFT JOIN purchase_transactions pt
                       ON m.reference_type = 'PURCHASE_TRANSACTION' AND pt.id = m.reference_id AND pt.tenant_id = :tenantId
                LEFT JOIN redemptions r
                       ON m.reference_type = 'REDEMPTION' AND r.id = m.reference_id AND r.tenant_id = :tenantId
                LEFT JOIN rewards rw ON rw.id = r.reward_id AND rw.tenant_id = :tenantId
                WHERE """ + " " + where(filter, params) + """

                ORDER BY m.created_at DESC, m.id DESC
                LIMIT :limit OFFSET :offset
                """;

        return jdbc.query(sql, params, (rs, i) -> {
            String referenceType = rs.getString("reference_type");
            Long referenceId = rs.getObject("reference_id") == null ? null : rs.getLong("reference_id");
            Long userId = rs.getObject("user_id") == null ? null : rs.getLong("user_id");
            String userName = userId == null ? null
                    : (rs.getString("user_first_name") + " " + rs.getString("user_last_name")).trim();
            return new AuditMovementEntry(
                    rs.getLong("id"),
                    rs.getTimestamp("created_at").toLocalDateTime(),
                    rs.getString("type"),
                    rs.getLong("customer_id"),
                    (rs.getString("first_name") + " " + rs.getString("last_name")).trim(),
                    rs.getString("email"),
                    rs.getLong("program_id"),
                    rs.getString("program_name"),
                    rs.getBigDecimal("points"),
                    referenceType,
                    referenceId,
                    referenceLabel(referenceType, referenceId, rs.getBigDecimal("purchase_amount"), rs.getString("reward_name")),
                    userId,
                    userName,
                    rs.getString("user_email"),
                    rs.getString("reason"),
                    rs.getString("description"));
        });
    }

    // Column names are constants; request values travel only as bind parameters.
    private static String where(AuditFilter filter, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder("m.tenant_id = :tenantId");
        params.addValue("tenantId", filter.tenantId());
        if (filter.from() != null) {
            where.append(" AND m.created_at >= :fromTs");
            params.addValue("fromTs", filter.from().atStartOfDay());
        }
        if (filter.to() != null) {
            where.append(" AND m.created_at < :toTs");
            params.addValue("toTs", filter.to().plusDays(1).atStartOfDay());
        }
        if (filter.type() != null) {
            where.append(" AND m.type = :type");
            params.addValue("type", filter.type().name());
        }
        if (filter.customerId() != null) {
            where.append(" AND m.customer_id = :customerId");
            params.addValue("customerId", filter.customerId());
        }
        if (filter.userId() != null) {
            where.append(" AND m.created_by = :userId");
            params.addValue("userId", filter.userId());
        }
        return where.toString();
    }

    private static String referenceLabel(String referenceType, Long referenceId, BigDecimal purchaseAmount, String rewardName) {
        if ("PURCHASE_TRANSACTION".equals(referenceType)) {
            return "Purchase #" + referenceId
                    + (purchaseAmount == null ? "" : " ($" + purchaseAmount.setScale(2, RoundingMode.HALF_UP).toPlainString() + ")");
        }
        if ("REDEMPTION".equals(referenceType)) {
            return "Redemption #" + referenceId + (rewardName == null ? "" : " (" + rewardName + ")");
        }
        return "Manual adjustment";
    }
}
