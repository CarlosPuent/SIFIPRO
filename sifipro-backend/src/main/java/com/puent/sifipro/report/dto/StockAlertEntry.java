package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Active reward whose stock is at or below the alert threshold.")
public record StockAlertEntry(
        @Schema(example = "5") Long id,
        @Schema(example = "Audífonos inalámbricos") String name,
        @Schema(example = "0") int stock,
        @Schema(example = "1500.0000") BigDecimal requiredPoints,
        @Schema(allowableValues = {"OUT_OF_STOCK", "LOW_STOCK"}, example = "OUT_OF_STOCK") String status) {
}
