package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Number of customers in one tier (tiers use the current global balance, see CustomerTier).")
public record TierDistributionEntry(
        @Schema(example = "SILVER") String tier,
        @Schema(example = "5") long customers,
        @Schema(description = "Sum of the balances of those customers.", example = "4380.0000") BigDecimal totalPoints) {
}
