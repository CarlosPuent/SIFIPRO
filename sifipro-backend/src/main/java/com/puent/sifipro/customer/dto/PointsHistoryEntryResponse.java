package com.puent.sifipro.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Single points movement entry with cumulative running balance. Ordered chronologically for chart rendering.")
public class PointsHistoryEntryResponse {

    @Schema(description = "Date and time of this movement.")
    private LocalDateTime date;

    @Schema(description = "Movement type: EARN, REDEEM, ADJUSTMENT, or EXPIRE.", example = "EARN")
    private String type;

    @Schema(description = "Points changed in this movement. Positive for EARN/ADJUSTMENT, negative for REDEEM/EXPIRE.", example = "300.0000")
    private BigDecimal points;

    @Schema(description = "Cumulative points balance after this movement. Use this as the Y-axis value for charts.", example = "750.0000")
    private BigDecimal runningBalance;

    @Schema(description = "Human-readable description of this movement.", example = "In-store purchase")
    private String description;

    @Schema(description = "Loyalty program associated with this movement.", example = "VIP Rewards")
    private String programName;

    @Schema(description = "Identifier of the internal user who created this movement.", example = "3")
    private Long createdBy;

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public BigDecimal getPoints() {
        return points;
    }

    public void setPoints(BigDecimal points) {
        this.points = points;
    }

    public BigDecimal getRunningBalance() {
        return runningBalance;
    }

    public void setRunningBalance(BigDecimal runningBalance) {
        this.runningBalance = runningBalance;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getProgramName() {
        return programName;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
