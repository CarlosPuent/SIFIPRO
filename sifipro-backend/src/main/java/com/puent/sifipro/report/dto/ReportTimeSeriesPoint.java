package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "One bucket (day or month) of the report time series. Empty buckets are returned with zeros.")
public record ReportTimeSeriesPoint(
        @Schema(description = "First day of the bucket.", example = "2026-07-01") LocalDate period,
        @Schema(example = "15") long purchases,
        @Schema(example = "3772.00") BigDecimal amount,
        @Schema(example = "5625.0000") BigDecimal pointsIssued,
        @Schema(example = "3") long redemptions,
        @Schema(example = "320.0000") BigDecimal pointsRedeemed) {
}
