package com.puent.sifipro.audit.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "One points movement (grant, redemption or adjustment) in the audit log.")
public record AuditMovementEntry(
        @Schema(example = "80") Long id,
        @Schema(description = "When the movement happened.") LocalDateTime date,
        @Schema(allowableValues = {"EARN", "REDEEM", "ADJUSTMENT", "EXPIRE"}, example = "ADJUSTMENT") String type,
        @Schema(example = "1") Long customerId,
        @Schema(example = "Laura Mendoza") String customerName,
        @Schema(example = "laura.mendoza@sifipro.dev") String customerEmail,
        @Schema(example = "1") Long programConfigId,
        @Schema(example = "SIFIPRO Rewards") String programName,
        @Schema(description = "Signed points: positive adds, negative removes.", example = "-20.0000") BigDecimal points,
        @Schema(allowableValues = {"PURCHASE_TRANSACTION", "REDEMPTION", "MANUAL_ADJUSTMENT"}, example = "MANUAL_ADJUSTMENT")
        String referenceType,
        @Schema(description = "Purchase or redemption id; null for manual adjustments.", example = "12") Long referenceId,
        @Schema(example = "Purchase #12 ($80.00)") String referenceLabel,
        @Schema(description = "Internal user who registered it (null for data older than the audit columns).", example = "2")
        Long registeredById,
        @Schema(example = "Carlos Puente") String registeredByName,
        @Schema(example = "admin@sifipro.com") String registeredByEmail,
        @Schema(description = "Reason of a manual adjustment; null for other types.", example = "Compensación por compra no registrada")
        String reason,
        @Schema(description = "Purchase description or redemption notes.", example = "Compra en tienda") String description) {
}
