package com.puent.sifipro.loyalty.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class UpdateProgramConfigRequest {

    @NotBlank(message = "Program name is required")
    @Size(max = 100, message = "Program name must not exceed 100 characters")
    private String programName;

    @NotNull(message = "Points per dollar is required")
    @Positive(message = "Points per dollar must be positive")
    private BigDecimal pointsPerDollar;

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
