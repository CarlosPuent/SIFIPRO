package com.puent.sifipro.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of a manual points adjustment.")
public record PointsAdjustmentResponse(
        @Schema(description = "Id of the ADJUSTMENT movement in the points ledger.", example = "80") Long movementId,
        @Schema(example = "1") Long customerId,
        @Schema(example = "1") Long programConfigId,
        @Schema(example = "SIFIPRO Rewards") String programName,
        @Schema(description = "Signed points applied.", example = "-20.0000") BigDecimal points,
        @Schema(example = "Compensación por compra no registrada") String reason,
        @Schema(description = "Customer global balance after the adjustment.", example = "2145.0000") BigDecimal pointsBalance,
        @Schema(description = "Customer balance in this program after the adjustment.", example = "2075.0000") BigDecimal programBalance,
        @Schema(description = "Internal user who made the adjustment.", example = "2") Long createdBy,
        LocalDateTime createdAt) {
}
