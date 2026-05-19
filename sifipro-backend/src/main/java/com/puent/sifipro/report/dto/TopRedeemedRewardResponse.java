package com.puent.sifipro.report.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Ranking entry for most redeemed rewards.")
public class TopRedeemedRewardResponse {

    @Schema(description = "Reward identifier.", example = "1")
    private Long rewardId;
    private String rewardName;
    @Schema(description = "Number of completed redemptions for the reward.", example = "4")
    private long totalRedemptions;

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

    public long getTotalRedemptions() {
        return totalRedemptions;
    }

    public void setTotalRedemptions(long totalRedemptions) {
        this.totalRedemptions = totalRedemptions;
    }
}
