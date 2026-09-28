package com.puent.sifipro.redemption.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Points a customer can redeem in one loyalty program (from the points ledger).")
public record ProgramPointsBalanceResponse(
        @Schema(description = "Customer identifier.", example = "1")
        Long customerId,

        @Schema(description = "Loyalty program identifier.", example = "1")
        Long programConfigId,

        @Schema(description = "Loyalty program name.", example = "SIFIPRO Rewards")
        String programName,

        @Schema(description = "Points available for redemptions in this program. This is the value the redemption "
                + "rules check, which can differ from the customer's global pointsBalance.", example = "2165.0000")
        BigDecimal availablePoints) {
}
