package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Global dashboard metrics for the loyalty MVP.")
public class DashboardSummaryResponse {

    @Schema(description = "Total customers registered in the system.", example = "3")
    private long totalCustomers;
    private long totalActiveCustomers;
    private long totalRewards;
    private long totalActiveRewards;
    private long totalTransactions;
    private long totalRedemptions;
    @Schema(description = "Total points issued from purchase transactions.", example = "512.5000")
    private BigDecimal totalPointsIssued;
    @Schema(description = "Total points redeemed by customers.", example = "120.0000")
    private BigDecimal totalPointsRedeemed;

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalActiveCustomers() {
        return totalActiveCustomers;
    }

    public void setTotalActiveCustomers(long totalActiveCustomers) {
        this.totalActiveCustomers = totalActiveCustomers;
    }

    public long getTotalRewards() {
        return totalRewards;
    }

    public void setTotalRewards(long totalRewards) {
        this.totalRewards = totalRewards;
    }

    public long getTotalActiveRewards() {
        return totalActiveRewards;
    }

    public void setTotalActiveRewards(long totalActiveRewards) {
        this.totalActiveRewards = totalActiveRewards;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public long getTotalRedemptions() {
        return totalRedemptions;
    }

    public void setTotalRedemptions(long totalRedemptions) {
        this.totalRedemptions = totalRedemptions;
    }

    public BigDecimal getTotalPointsIssued() {
        return totalPointsIssued;
    }

    public void setTotalPointsIssued(BigDecimal totalPointsIssued) {
        this.totalPointsIssued = totalPointsIssued;
    }

    public BigDecimal getTotalPointsRedeemed() {
        return totalPointsRedeemed;
    }

    public void setTotalPointsRedeemed(BigDecimal totalPointsRedeemed) {
        this.totalPointsRedeemed = totalPointsRedeemed;
    }
}
