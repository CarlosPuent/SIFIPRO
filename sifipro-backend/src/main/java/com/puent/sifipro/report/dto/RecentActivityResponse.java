package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Latest purchases and redemptions of a program (Dashboard activity).")
public record RecentActivityResponse(
        List<RecentTransaction> transactions,
        List<RecentRedemption> redemptions) {

    @Schema(description = "Recent purchase.")
    public record RecentTransaction(
            Long id,
            String customerFullName,
            BigDecimal amount,
            BigDecimal pointsEarned,
            LocalDateTime transactionDate) {
    }

    @Schema(description = "Recent redemption.")
    public record RecentRedemption(
            Long id,
            String customerFullName,
            String rewardName,
            BigDecimal pointsUsed,
            LocalDateTime redemptionDate) {
    }
}
