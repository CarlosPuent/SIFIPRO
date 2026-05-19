package com.puent.sifipro.report.controller;

import java.util.List;
import com.puent.sifipro.report.dto.DashboardSummaryResponse;
import com.puent.sifipro.report.dto.TopCustomerResponse;
import com.puent.sifipro.report.dto.TopRedeemedRewardResponse;
import com.puent.sifipro.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Dashboard and ranking reports for the loyalty MVP.")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard summary", description = "Returns global summary metrics for customers, rewards, transactions, redemptions, and points.")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        DashboardSummaryResponse response = reportService.getDashboardSummary();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-customers")
    @Operation(summary = "Get top customers", description = "Returns the top 5 customers ordered by points balance descending.")
    public ResponseEntity<List<TopCustomerResponse>> getTopCustomers() {
        List<TopCustomerResponse> response = reportService.getTopCustomers();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-redeemed-rewards")
    @Operation(summary = "Get top redeemed rewards", description = "Returns the top 5 rewards ordered by number of redemptions.")
    public ResponseEntity<List<TopRedeemedRewardResponse>> getTopRedeemedRewards() {
        List<TopRedeemedRewardResponse> response = reportService.getTopRedeemedRewards();
        return ResponseEntity.ok(response);
    }
}
