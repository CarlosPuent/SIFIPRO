package com.puent.sifipro.report.service;

import java.io.Writer;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.puent.sifipro.customer.CustomerTier;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.report.dto.RecentActivityResponse;
import com.puent.sifipro.report.dto.ReportGranularity;
import com.puent.sifipro.report.dto.ReportSummaryResponse;
import com.puent.sifipro.report.dto.ReportTimeSeriesPoint;
import com.puent.sifipro.report.dto.StockAlertEntry;
import com.puent.sifipro.report.dto.TierDistributionEntry;
import com.puent.sifipro.report.dto.TopCustomerReportEntry;
import com.puent.sifipro.report.dto.TopRewardReportEntry;
import com.puent.sifipro.report.export.CsvWriter;
import com.puent.sifipro.report.repository.ReportQueryRepository;
import com.puent.sifipro.report.repository.ReportQueryRepository.CustomerTotals;
import com.puent.sifipro.report.repository.ReportQueryRepository.PeriodPurchases;
import com.puent.sifipro.report.repository.ReportQueryRepository.PeriodRedemptions;
import com.puent.sifipro.report.repository.ReportQueryRepository.PurchaseTotals;
import com.puent.sifipro.report.repository.ReportQueryRepository.RedemptionTotals;
import com.puent.sifipro.report.repository.ReportQueryRepository.RewardTotals;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportServiceImpl implements ReportService {

    private static final int DEFAULT_TOP_LIMIT = 10;
    private static final int DEFAULT_RECENT_LIMIT = 5;
    private static final int MAX_LIMIT = 50;
    private static final int DEFAULT_STOCK_THRESHOLD = 5;
    private static final int MAX_DAILY_POINTS = 1000;

    private final ReportQueryRepository reportQueryRepository;
    private final ProgramConfigRepository programConfigRepository;
    private final AppUserRepository appUserRepository;

    public ReportServiceImpl(
            ReportQueryRepository reportQueryRepository,
            ProgramConfigRepository programConfigRepository,
            AppUserRepository appUserRepository) {
        this.reportQueryRepository = reportQueryRepository;
        this.programConfigRepository = programConfigRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ReportScope resolveScope(Long programConfigId, LocalDate from, LocalDate to, String currentUserEmail) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessException("'from' must be on or before 'to'.");
        }

        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();

        // A program of another tenant is indistinguishable from a missing one.
        ProgramConfig program = programConfigRepository.findByIdAndTenantId(programConfigId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Program not found with id: " + programConfigId));

        return new ReportScope(tenantId, currentUser.getTenant().getCode(), program.getId(),
                program.getProgramName(), from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportSummaryResponse getSummary(Long programConfigId, LocalDate from, LocalDate to, String currentUserEmail) {
        return buildSummary(resolveScope(programConfigId, from, to, currentUserEmail));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportTimeSeriesPoint> getTimeSeries(
            Long programConfigId, LocalDate from, LocalDate to, ReportGranularity granularity, String currentUserEmail) {
        ReportScope scope = resolveScope(programConfigId, from, to, currentUserEmail);
        ReportGranularity bucket = granularity == null ? ReportGranularity.DAY : granularity;

        Map<LocalDate, PeriodPurchases> purchases = reportQueryRepository.purchasesByPeriod(scope, bucket).stream()
                .collect(Collectors.toMap(PeriodPurchases::period, Function.identity()));
        Map<LocalDate, PeriodRedemptions> redemptions = reportQueryRepository.redemptionsByPeriod(scope, bucket).stream()
                .collect(Collectors.toMap(PeriodRedemptions::period, Function.identity()));

        TreeMap<LocalDate, Boolean> periodsWithData = new TreeMap<>();
        purchases.keySet().forEach(period -> periodsWithData.put(period, true));
        redemptions.keySet().forEach(period -> periodsWithData.put(period, true));

        // Fill the whole requested range (or the span of the data) so charts show empty
        // days/months as zeros instead of skipping them.
        LocalDate start = scope.from() != null ? truncate(scope.from(), bucket)
                : periodsWithData.isEmpty() ? null : periodsWithData.firstKey();
        LocalDate end = scope.to() != null ? truncate(scope.to(), bucket)
                : truncate(periodsWithData.isEmpty() ? LocalDate.now() : max(periodsWithData.lastKey(), LocalDate.now()), bucket);
        if (start == null || start.isAfter(end)) {
            return List.of();
        }
        if (bucket == ReportGranularity.DAY && ChronoUnit.DAYS.between(start, end) > MAX_DAILY_POINTS) {
            throw new BusinessException("Range too large for daily granularity; use MONTH.");
        }

        List<ReportTimeSeriesPoint> series = new ArrayList<>();
        for (LocalDate period = start; !period.isAfter(end); period = next(period, bucket)) {
            PeriodPurchases p = purchases.get(period);
            PeriodRedemptions r = redemptions.get(period);
            series.add(new ReportTimeSeriesPoint(
                    period,
                    p == null ? 0 : p.purchases(),
                    p == null ? BigDecimal.ZERO : p.amount(),
                    p == null ? BigDecimal.ZERO : p.pointsIssued(),
                    r == null ? 0 : r.redemptions(),
                    r == null ? BigDecimal.ZERO : r.pointsRedeemed()));
        }
        return series;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopCustomerReportEntry> getTopCustomers(
            Long programConfigId, LocalDate from, LocalDate to, Integer limit, String currentUserEmail) {
        ReportScope scope = resolveScope(programConfigId, from, to, currentUserEmail);
        return reportQueryRepository.topCustomers(scope, clamp(limit, DEFAULT_TOP_LIMIT));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopRewardReportEntry> getTopRewards(
            Long programConfigId, LocalDate from, LocalDate to, Integer limit, String currentUserEmail) {
        ReportScope scope = resolveScope(programConfigId, from, to, currentUserEmail);
        return reportQueryRepository.topRewards(scope, clamp(limit, DEFAULT_TOP_LIMIT));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TierDistributionEntry> getTierDistribution(String currentUserEmail) {
        Long tenantId = findAuthenticatedUser(currentUserEmail).getTenant().getId();
        // Same thresholds as CustomerTier (single source of truth for tiers).
        Map<String, TierDistributionEntry> byTier = reportQueryRepository.tierDistribution(
                        tenantId, CustomerTier.SILVER.getThreshold(), CustomerTier.GOLD.getThreshold())
                .stream()
                .collect(Collectors.toMap(TierDistributionEntry::tier, Function.identity()));

        // Always return the three tiers in order, with zeros for empty ones.
        List<TierDistributionEntry> distribution = new ArrayList<>();
        for (CustomerTier tier : CustomerTier.values()) {
            distribution.add(byTier.getOrDefault(tier.name(), new TierDistributionEntry(tier.name(), 0, BigDecimal.ZERO)));
        }
        return distribution;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockAlertEntry> getStockAlerts(
            Long programConfigId, Integer threshold, Integer limit, String currentUserEmail) {
        ReportScope scope = resolveScope(programConfigId, null, null, currentUserEmail);
        int stockThreshold = threshold == null ? DEFAULT_STOCK_THRESHOLD : Math.max(0, threshold);
        return reportQueryRepository.stockAlerts(scope, stockThreshold, clamp(limit, DEFAULT_TOP_LIMIT));
    }

    @Override
    @Transactional(readOnly = true)
    public RecentActivityResponse getRecentActivity(Long programConfigId, Integer limit, String currentUserEmail) {
        ReportScope scope = resolveScope(programConfigId, null, null, currentUserEmail);
        int size = clamp(limit, DEFAULT_RECENT_LIMIT);
        return new RecentActivityResponse(
                reportQueryRepository.recentTransactions(scope, size),
                reportQueryRepository.recentRedemptions(scope, size));
    }

    @Override
    @Transactional(readOnly = true)
    public void writeSummaryCsv(ReportScope scope, Writer writer) {
        ReportSummaryResponse summary = buildSummary(scope);
        CsvWriter csv = new CsvWriter(writer).writeBom();
        csv.row("metric", "value")
                .row("tenant", scope.tenantCode())
                .row("program", summary.programName())
                .row("from", summary.from() == null ? "" : summary.from().toString())
                .row("to", summary.to() == null ? "" : summary.to().toString())
                .row("purchases", summary.purchases())
                .row("total_amount", summary.totalAmount())
                .row("points_issued", summary.pointsIssued())
                .row("redemptions", summary.redemptions())
                .row("points_redeemed", summary.pointsRedeemed())
                .row("purchasing_customers", summary.purchasingCustomers())
                .row("total_customers", summary.totalCustomers())
                .row("active_customers", summary.activeCustomers())
                .row("new_customers", summary.newCustomers())
                .row("program_rewards", summary.programRewards())
                .row("program_active_rewards", summary.programActiveRewards());
        csv.flush();
    }

    @Override
    @Transactional(readOnly = true)
    public void writePurchasesCsv(ReportScope scope, Writer writer) {
        CsvWriter csv = new CsvWriter(writer).writeBom();
        csv.row("purchase_id", "transaction_date", "customer", "customer_email", "amount",
                "points_earned", "description", "registered_by");
        reportQueryRepository.streamPurchases(scope, rs -> csv.row(
                rs.getLong("id"),
                rs.getTimestamp("transaction_date").toLocalDateTime().toString(),
                (rs.getString("first_name") + " " + rs.getString("last_name")).trim(),
                rs.getString("email"),
                rs.getBigDecimal("amount"),
                rs.getBigDecimal("points_earned"),
                rs.getString("description"),
                rs.getString("registered_by")));
        csv.flush();
    }

    private ReportSummaryResponse buildSummary(ReportScope scope) {
        PurchaseTotals purchases = reportQueryRepository.purchaseTotals(scope);
        RedemptionTotals redemptions = reportQueryRepository.redemptionTotals(scope);
        CustomerTotals customers = reportQueryRepository.customerTotals(scope);
        RewardTotals rewards = reportQueryRepository.rewardTotals(scope);

        return new ReportSummaryResponse(
                scope.programConfigId(),
                scope.programName(),
                scope.from(),
                scope.to(),
                purchases.purchases(),
                purchases.amount(),
                purchases.pointsIssued(),
                redemptions.redemptions(),
                redemptions.pointsRedeemed(),
                purchases.purchasingCustomers(),
                customers.total(),
                customers.active(),
                customers.created(),
                rewards.total(),
                rewards.active());
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private static int clamp(Integer limit, int defaultValue) {
        if (limit == null) {
            return defaultValue;
        }
        return Math.max(1, Math.min(MAX_LIMIT, limit));
    }

    private static LocalDate truncate(LocalDate date, ReportGranularity granularity) {
        return granularity == ReportGranularity.MONTH ? date.withDayOfMonth(1) : date;
    }

    private static LocalDate next(LocalDate period, ReportGranularity granularity) {
        return granularity == ReportGranularity.MONTH ? period.plusMonths(1) : period.plusDays(1);
    }

    private static LocalDate max(LocalDate a, LocalDate b) {
        return a.isAfter(b) ? a : b;
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
