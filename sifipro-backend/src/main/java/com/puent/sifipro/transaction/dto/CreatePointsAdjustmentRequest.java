package com.puent.sifipro.transaction.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Manual points adjustment for one customer in one program (ADMIN only).")
public class CreatePointsAdjustmentRequest {

    @Schema(description = "Program whose balance is adjusted.", example = "1")
    @NotNull(message = "Program config id is required")
    private Long programConfigId;

    @Schema(description = "Points to add (positive) or remove (negative). Cannot be zero.", example = "-20")
    @NotNull(message = "Points are required")
    @Digits(integer = 8, fraction = 4, message = "Points must have at most 8 integer digits and 4 decimals")
    private BigDecimal points;

    @Schema(description = "Why the adjustment is made; stored in the audit log.", example = "Compensación por compra no registrada")
    @NotBlank(message = "Reason is required")
    @Size(min = 5, max = 255, message = "Reason must be between 5 and 255 characters")
    private String reason;

    public Long getProgramConfigId() {
        return programConfigId;
    }

    public void setProgramConfigId(Long programConfigId) {
        this.programConfigId = programConfigId;
    }

    public BigDecimal getPoints() {
        return points;
    }

    public void setPoints(BigDecimal points) {
        this.points = points;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
