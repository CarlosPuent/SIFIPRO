package com.puent.sifipro.redemption.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.puent.sifipro.redemption.entity.RedemptionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Redemption representation returned by the API.")
public class RedemptionResponse {

    @Schema(description = "Redemption identifier.", example = "1")
    private Long id;
    private Long customerId;
    private String customerFullName;
    private Long rewardId;
    private String rewardName;
    private Long programConfigId;
    private String programName;
    @Schema(description = "Points consumed in the redemption.", example = "120.0000")
    private BigDecimal pointsUsed;
    private LocalDateTime redemptionDate;
    private RedemptionStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Schema(description = "Identifier of the internal user who created this redemption.", example = "3")
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

    public String getCustomerFullName() {
        return customerFullName;
    }

    public void setCustomerFullName(String customerFullName) {
        this.customerFullName = customerFullName;
    }

    public Long getRewardId() {
        return rewardId;
    }

    public void setRewardId(Long rewardId) {
        this.rewardId = rewardId;
    }

    public String getRewardName() {
        return rewardName;
    }

    public void setRewardName(String rewardName) {
        this.rewardName = rewardName;
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

    public BigDecimal getPointsUsed() {
        return pointsUsed;
    }

    public void setPointsUsed(BigDecimal pointsUsed) {
        this.pointsUsed = pointsUsed;
    }

    public LocalDateTime getRedemptionDate() {
        return redemptionDate;
    }

    public void setRedemptionDate(LocalDateTime redemptionDate) {
        this.redemptionDate = redemptionDate;
    }

    public RedemptionStatus getStatus() {
        return status;
    }

    public void setStatus(RedemptionStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
