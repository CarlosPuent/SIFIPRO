package com.puent.sifipro.report.service;

import java.io.Writer;
import java.time.LocalDate;
import java.util.List;
import com.puent.sifipro.report.dto.RecentActivityResponse;
import com.puent.sifipro.report.dto.ReportGranularity;
import com.puent.sifipro.report.dto.ReportSummaryResponse;
import com.puent.sifipro.report.dto.ReportTimeSeriesPoint;
import com.puent.sifipro.report.dto.StockAlertEntry;
import com.puent.sifipro.report.dto.TierDistributionEntry;
import com.puent.sifipro.report.dto.TopCustomerReportEntry;
import com.puent.sifipro.report.dto.TopRewardReportEntry;

/**
 * Tenant-scoped reporting. Every method resolves the tenant from the authenticated
 * user's email; a programConfigId of another tenant is reported as not found.
 */
public interface ReportService {

    /** Validates the request and resolves it to a tenant-isolated scope (404/400 on failure). */
    ReportScope resolveScope(Long programConfigId, LocalDate from, LocalDate to, String currentUserEmail);

    ReportSummaryResponse getSummary(Long programConfigId, LocalDate from, LocalDate to, String currentUserEmail);

    List<ReportTimeSeriesPoint> getTimeSeries(
            Long programConfigId, LocalDate from, LocalDate to, ReportGranularity granularity, String currentUserEmail);

    List<TopCustomerReportEntry> getTopCustomers(
            Long programConfigId, LocalDate from, LocalDate to, Integer limit, String currentUserEmail);

    List<TopRewardReportEntry> getTopRewards(
            Long programConfigId, LocalDate from, LocalDate to, Integer limit, String currentUserEmail);

    List<TierDistributionEntry> getTierDistribution(String currentUserEmail);

    List<StockAlertEntry> getStockAlerts(Long programConfigId, Integer threshold, Integer limit, String currentUserEmail);

    RecentActivityResponse getRecentActivity(Long programConfigId, Integer limit, String currentUserEmail);

    void writeSummaryCsv(ReportScope scope, Writer writer);

    void writePurchasesCsv(ReportScope scope, Writer writer);
}
