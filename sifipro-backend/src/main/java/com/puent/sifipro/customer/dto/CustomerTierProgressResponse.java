package com.puent.sifipro.customer.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Customer tier classification and progress toward the next tier.")
public class CustomerTierProgressResponse {

    @Schema(description = "Current tier name.", example = "SILVER")
    private String currentTier;

    @Schema(description = "Next tier name. Null when the customer is already at GOLD.", example = "GOLD")
    private String nextTier;

    @Schema(description = "Current points balance used for tier calculation.", example = "750.0000")
    private BigDecimal currentPoints;

    @Schema(description = "Points threshold required to reach the next tier. Null at GOLD.", example = "2000")
    private BigDecimal pointsForNextTier;

    @Schema(description = "Points still needed to reach the next tier. Zero at GOLD.", example = "1250.0000")
    private BigDecimal pointsToNextTier;

    @Schema(description = "Progress percentage toward the next tier (0.0–100.0).", example = "37.5")
    private double progressPercentage;

    public String getCurrentTier() {
        return currentTier;
    }

    public void setCurrentTier(String currentTier) {
        this.currentTier = currentTier;
    }

    public String getNextTier() {
        return nextTier;
    }

    public void setNextTier(String nextTier) {
        this.nextTier = nextTier;
    }

    public BigDecimal getCurrentPoints() {
        return currentPoints;
    }

    public void setCurrentPoints(BigDecimal currentPoints) {
        this.currentPoints = currentPoints;
    }

    public BigDecimal getPointsForNextTier() {
        return pointsForNextTier;
    }

    public void setPointsForNextTier(BigDecimal pointsForNextTier) {
        this.pointsForNextTier = pointsForNextTier;
    }

    public BigDecimal getPointsToNextTier() {
        return pointsToNextTier;
    }

    public void setPointsToNextTier(BigDecimal pointsToNextTier) {
        this.pointsToNextTier = pointsToNextTier;
    }

    public double getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(double progressPercentage) {
        this.progressPercentage = progressPercentage;
    }
}
