package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Customer ranked by points earned in the program and range.")
public record TopCustomerReportEntry(
        @Schema(example = "2") Long customerId,
        @Schema(example = "Andres Lopez") String customerFullName,
        @Schema(example = "andres.lopez@sifipro.dev") String email,
        boolean active,
        @Schema(description = "Purchases in the program and range.", example = "7") long purchases,
        @Schema(example = "2490.00") BigDecimal amount,
        @Schema(description = "Points earned in the program and range.", example = "3765.0000") BigDecimal pointsEarned,
        @Schema(description = "Redemptions in the program and range.", example = "1") long redemptions,
        @Schema(description = "Current global points balance.", example = "2175.0000") BigDecimal pointsBalance) {
}
