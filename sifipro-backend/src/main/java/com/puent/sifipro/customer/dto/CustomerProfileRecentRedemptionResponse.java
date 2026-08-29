package com.puent.sifipro.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Compact redemption entry for the customer profile activity feed.")
public class CustomerProfileRecentRedemptionResponse {

    @Schema(description = "Redemption identifier.", example = "5")
    private Long id;

    @Schema(description = "Name of the redeemed reward.", example = "Free Premium Coffee")
    private String rewardName;

    @Schema(description = "Image URL of the redeemed reward.", example = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400")
    private String rewardImageUrl;

    @Schema(description = "Points consumed by this redemption.", example = "90.0000")
    private BigDecimal pointsUsed;

    @Schema(description = "Date and time of the redemption.")
    private LocalDateTime redemptionDate;

    @Schema(description = "Redemption status.", example = "COMPLETED")
    private String status;

    @Schema(description = "Identifier of the internal user who created this redemption.", example = "3")
    private Long createdBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRewardName() {
        return rewardName;
    }

    public void setRewardName(String rewardName) {
        this.rewardName = rewardName;
    }

    public String getRewardImageUrl() {
        return rewardImageUrl;
    }

    public void setRewardImageUrl(String rewardImageUrl) {
        this.rewardImageUrl = rewardImageUrl;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
