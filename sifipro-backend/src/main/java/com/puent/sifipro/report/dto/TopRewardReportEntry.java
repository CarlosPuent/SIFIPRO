package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Reward ranked by completed redemptions in the program and range.")
public record TopRewardReportEntry(
        @Schema(example = "6") Long rewardId,
        @Schema(example = "Café Premium Gratis") String rewardName,
        @Schema(example = "4") long redemptions,
        @Schema(example = "360.0000") BigDecimal pointsRedeemed,
        @Schema(description = "Current stock.", example = "11") int stock) {
}
