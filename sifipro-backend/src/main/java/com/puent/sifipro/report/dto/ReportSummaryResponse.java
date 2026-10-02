package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Aggregated figures for one program of the authenticated tenant, optionally limited to a date range.")
public record ReportSummaryResponse(
        @Schema(example = "1") Long programConfigId,
        @Schema(example = "SIFIPRO Rewards") String programName,
        @Schema(description = "Start of the range (inclusive); null = no lower bound.", example = "2026-06-01") LocalDate from,
        @Schema(description = "End of the range (inclusive); null = no upper bound.", example = "2026-09-30") LocalDate to,

        @Schema(description = "Purchases registered in the program and range.", example = "37") long purchases,
        @Schema(description = "Sum of purchase amounts.", example = "9860.00") BigDecimal totalAmount,
        @Schema(description = "Points issued by those purchases. Manual adjustments (ADJUSTMENT) are not included.", example = "14790.0000") BigDecimal pointsIssued,
        @Schema(description = "Completed redemptions in the program and range.", example = "11") long redemptions,
        @Schema(description = "Points consumed by those redemptions. Manual adjustments (ADJUSTMENT) are not included.", example = "4460.0000") BigDecimal pointsRedeemed,
        @Schema(description = "Distinct customers with at least one purchase in the program and range.", example = "13") long purchasingCustomers,

        @Schema(description = "Customers of the tenant (customers are not program-scoped).", example = "15") long totalCustomers,
        @Schema(description = "Customers of the tenant currently active.", example = "14") long activeCustomers,
        @Schema(description = "Customers of the tenant created within the range (all of them when there is no range).", example = "15") long newCustomers,

        @Schema(description = "Rewards of the program.", example = "5") long programRewards,
        @Schema(description = "Active rewards of the program.", example = "5") long programActiveRewards) {
}
