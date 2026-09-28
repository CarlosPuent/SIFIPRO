package com.puent.sifipro.report.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
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
import com.puent.sifipro.report.service.ReportScope;
import com.puent.sifipro.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Aggregated, tenant-scoped reports. The tenant is always taken from the "
        + "authenticated user; a programConfigId of another tenant returns 404. Dates are inclusive (yyyy-MM-dd) "
        + "and optional: without them the whole history is used.")
@SecurityRequirement(name = "bearerAuth")
@ApiResponses({
        @ApiResponse(responseCode = "400", description = "Invalid parameters (e.g. 'from' after 'to')."),
        @ApiResponse(responseCode = "401", description = "Missing or invalid token."),
        @ApiResponse(responseCode = "404", description = "Program not found in the authenticated tenant.")
})
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Report summary",
            description = "Purchases, amount, points issued and redeemed, redemptions and customer/reward counts "
                    + "for one program, optionally within [from, to]. Points issued come only from purchases and "
                    + "points redeemed only from redemptions: manual adjustments are excluded (see the audit log).")
    public ResponseEntity<ReportSummaryResponse> getSummary(
            @Parameter(description = "Program of the authenticated tenant.", example = "1") @RequestParam Long programConfigId,
            @Parameter(description = "Start date, inclusive.", example = "2026-06-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date, inclusive.", example = "2026-09-30")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.getSummary(programConfigId, from, to, authentication.getName()));
    }

    @GetMapping("/timeseries")
    @Operation(summary = "Report time series",
            description = "Purchases, amount, points issued, redemptions and points redeemed per day or month. "
                    + "Buckets without activity are returned with zeros.")
    public ResponseEntity<List<ReportTimeSeriesPoint>> getTimeSeries(
            @RequestParam Long programConfigId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Bucket size. Default DAY.") @RequestParam(required = false) ReportGranularity granularity,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.getTimeSeries(programConfigId, from, to, granularity, authentication.getName()));
    }

    @GetMapping("/top-customers")
    @Operation(summary = "Top customers",
            description = "Customers ranked by points earned in the program within the range (max 50).")
    public ResponseEntity<List<TopCustomerReportEntry>> getTopCustomers(
            @RequestParam Long programConfigId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Rows to return (1-50). Default 10.") @RequestParam(required = false) Integer limit,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.getTopCustomers(programConfigId, from, to, limit, authentication.getName()));
    }

    @GetMapping("/top-rewards")
    @Operation(summary = "Top redeemed rewards",
            description = "Rewards ranked by completed redemptions in the program within the range (max 50).")
    public ResponseEntity<List<TopRewardReportEntry>> getTopRewards(
            @RequestParam Long programConfigId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Rows to return (1-50). Default 10.") @RequestParam(required = false) Integer limit,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.getTopRewards(programConfigId, from, to, limit, authentication.getName()));
    }

    @GetMapping("/tier-distribution")
    @Operation(summary = "Customers per tier",
            description = "BRONZE / SILVER / GOLD counts for the authenticated tenant. Tiers use each customer's "
                    + "current global balance (same thresholds as the customer profile), so this report is "
                    + "tenant-wide and not filtered by program or dates.")
    public ResponseEntity<List<TierDistributionEntry>> getTierDistribution(Authentication authentication) {
        return ResponseEntity.ok(reportService.getTierDistribution(authentication.getName()));
    }

    @GetMapping("/stock-alerts")
    @Operation(summary = "Low or out-of-stock rewards",
            description = "Active rewards of the program whose stock is at or below the threshold, lowest first.")
    public ResponseEntity<List<StockAlertEntry>> getStockAlerts(
            @RequestParam Long programConfigId,
            @Parameter(description = "Stock threshold, inclusive. Default 5.") @RequestParam(required = false) Integer threshold,
            @Parameter(description = "Rows to return (1-50). Default 10.") @RequestParam(required = false) Integer limit,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.getStockAlerts(programConfigId, threshold, limit, authentication.getName()));
    }

    @GetMapping("/recent-activity")
    @Operation(summary = "Recent activity",
            description = "Latest purchases and redemptions of the program (used by the Dashboard).")
    public ResponseEntity<RecentActivityResponse> getRecentActivity(
            @RequestParam Long programConfigId,
            @Parameter(description = "Rows per list (1-50). Default 5.") @RequestParam(required = false) Integer limit,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.getRecentActivity(programConfigId, limit, authentication.getName()));
    }

    @GetMapping("/export/summary.csv")
    @Operation(summary = "Export summary as CSV", description = "Same figures as /summary, as metric;value rows (semicolon-separated, UTF-8 with BOM).")
    @ApiResponse(responseCode = "200", content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    public void exportSummaryCsv(
            @RequestParam Long programConfigId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication,
            HttpServletResponse response) throws IOException {
        // Resolve (and validate) first: errors must still be JSON, before any CSV header is sent.
        ReportScope scope = reportService.resolveScope(programConfigId, from, to, authentication.getName());
        prepareCsvResponse(response, fileName("summary", scope));
        reportService.writeSummaryCsv(scope, response.getWriter());
    }

    @GetMapping("/export/purchases.csv")
    @Operation(summary = "Export purchases as CSV",
            description = "Every purchase of the program within the range, streamed row by row (semicolon-separated, UTF-8 with BOM).")
    @ApiResponse(responseCode = "200", content = @Content(mediaType = "text/csv", schema = @Schema(type = "string")))
    public void exportPurchasesCsv(
            @RequestParam Long programConfigId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication,
            HttpServletResponse response) throws IOException {
        ReportScope scope = reportService.resolveScope(programConfigId, from, to, authentication.getName());
        prepareCsvResponse(response, fileName("purchases", scope));
        reportService.writePurchasesCsv(scope, response.getWriter());
    }

    private static void prepareCsvResponse(HttpServletResponse response, String fileName) {
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("text/csv;charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
    }

    // e.g. sifipro-purchases-demo-program1-2026-06-01_2026-09-30.csv (tenant code is [a-z0-9-])
    private static String fileName(String report, ReportScope scope) {
        String range = (scope.from() == null ? "start" : scope.from().toString())
                + "_" + (scope.to() == null ? "today" : scope.to().toString());
        String tenant = scope.tenantCode() == null ? "tenant" : scope.tenantCode().replaceAll("[^A-Za-z0-9-]", "");
        return "sifipro-" + report + "-" + tenant + "-program" + scope.programConfigId() + "-" + range + ".csv";
    }
}
