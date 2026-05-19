package com.puent.sifipro.loyalty.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to create the loyalty program configuration.")
public class CreateProgramConfigRequest {

    @Schema(description = "Display name of the loyalty program.", example = "SIFIPRO Rewards")
    @NotBlank(message = "Program name is required")
    @Size(max = 100, message = "Program name must not exceed 100 characters")
    private String programName;

    @Schema(description = "Points granted per purchase dollar.", example = "1.2500")
    @NotNull(message = "Points per dollar is required")
    @Positive(message = "Points per dollar must be positive")
    private BigDecimal pointsPerDollar;

    @Schema(description = "Minimum purchase amount required to earn points.", example = "20.00")
    @NotNull(message = "Minimum purchase amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Minimum purchase amount must be zero or positive")
    private BigDecimal minimumPurchaseAmount;

    @NotNull(message = "Active flag is required")
    private Boolean active;

    public String getProgramName() {
        return programName;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public BigDecimal getPointsPerDollar() {
        return pointsPerDollar;
    }

    public void setPointsPerDollar(BigDecimal pointsPerDollar) {
        this.pointsPerDollar = pointsPerDollar;
    }

    public BigDecimal getMinimumPurchaseAmount() {
        return minimumPurchaseAmount;
    }

    public void setMinimumPurchaseAmount(BigDecimal minimumPurchaseAmount) {
        this.minimumPurchaseAmount = minimumPurchaseAmount;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
