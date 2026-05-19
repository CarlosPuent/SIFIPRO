package com.puent.sifipro.loyalty.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Program configuration returned by the API.")
public class ProgramConfigResponse {

    @Schema(description = "Program configuration identifier.", example = "1")
    private Long id;
    @Schema(description = "Program name.", example = "SIFIPRO Rewards")
    private String programName;
    @Schema(description = "Points granted per dollar.", example = "1.2500")
    private BigDecimal pointsPerDollar;
    @Schema(description = "Minimum purchase to issue points.", example = "20.00")
    private BigDecimal minimumPurchaseAmount;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
