package com.puent.sifipro.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Points movement ledger entry returned by the API.")
public class PointsMovementResponse {

    @Schema(description = "Points movement identifier.", example = "15")
    private Long id;

    @Schema(description = "Identifier of the customer associated with this movement.", example = "1")
    private Long customerId;

    @Schema(description = "Identifier of the loyalty program associated with this movement.", example = "1")
    private Long programConfigId;

    @Schema(description = "Loyalty program name associated with this movement.", example = "VIP Rewards")
    private String programName;

    private PointsMovementType type;

    @Schema(description = "Points moved in this ledger entry.", example = "120.0000")
    private BigDecimal points;

    private String description;
    private String referenceType;
    private Long referenceId;

    @Schema(description = "Effective movement date and time.")
    private LocalDateTime movementDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Schema(description = "Identifier of the internal user who created this movement.", example = "3")
    private Long createdBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getProgramConfigId() {
        return programConfigId;
    }

    public void setProgramConfigId(Long programConfigId) {
        this.programConfigId = programConfigId;
    }

    public String getProgramName() {
        return programName;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public PointsMovementType getType() {
        return type;
    }

    public void setType(PointsMovementType type) {
        this.type = type;
    }

    public BigDecimal getPoints() {
        return points;
    }

    public void setPoints(BigDecimal points) {
        this.points = points;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public LocalDateTime getMovementDate() {
        return movementDate;
    }

    public void setMovementDate(LocalDateTime movementDate) {
        this.movementDate = movementDate;
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

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
