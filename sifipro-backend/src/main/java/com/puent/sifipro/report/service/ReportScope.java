package com.puent.sifipro.report.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Validated scope of a report request. tenantId always comes from the authenticated
 * user (never from the request) and programConfigId has been checked to belong to
 * that tenant, so every query built from a scope is tenant-isolated by construction.
 *
 * @param from inclusive start date, or null for no lower bound
 * @param to   inclusive end date, or null for no upper bound
 */
public record ReportScope(
        Long tenantId,
        String tenantCode,
        Long programConfigId,
        String programName,
        LocalDate from,
        LocalDate to) {

    /** Start of {@code from} (inclusive bound), or null. */
    public LocalDateTime fromInclusive() {
        return from == null ? null : from.atStartOfDay();
    }

    /** Start of the day after {@code to} (exclusive bound), so the whole {@code to} day counts. */
    public LocalDateTime toExclusive() {
        return to == null ? null : to.plusDays(1).atStartOfDay();
    }
}
