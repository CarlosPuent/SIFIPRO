package com.puent.sifipro.customer.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Lifetime activity statistics for a customer.")
public class CustomerStatsResponse {

    @Schema(description = "Total number of purchase transactions recorded.", example = "12")
    private long totalTransactions;

    @Schema(description = "Total number of completed redemptions.", example = "3")
    private long totalRedemptions;

    @Schema(description = "Total points earned across all transactions.", example = "1200.0000")
    private BigDecimal lifetimePointsEarned;

    @Schema(description = "Total points redeemed across all redemptions.", example = "450.0000")
    private BigDecimal lifetimePointsRedeemed;

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

    public BigDecimal getLifetimePointsEarned() {
        return lifetimePointsEarned;
    }

    public void setLifetimePointsEarned(BigDecimal lifetimePointsEarned) {
        this.lifetimePointsEarned = lifetimePointsEarned;
    }

    public BigDecimal getLifetimePointsRedeemed() {
        return lifetimePointsRedeemed;
    }

    public void setLifetimePointsRedeemed(BigDecimal lifetimePointsRedeemed) {
        this.lifetimePointsRedeemed = lifetimePointsRedeemed;
    }
}
