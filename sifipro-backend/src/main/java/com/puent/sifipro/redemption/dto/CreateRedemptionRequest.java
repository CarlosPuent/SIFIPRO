package com.puent.sifipro.redemption.dto;

import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to redeem a reward using customer points.")
public class CreateRedemptionRequest {

    @Schema(description = "Identifier of the customer making the redemption.", example = "1")
    @NotNull(message = "Customer id is required")
    private Long customerId;

    @Schema(description = "Identifier of the reward being redeemed.", example = "2")
    @NotNull(message = "Reward id is required")
    private Long rewardId;

    @Schema(description = "Date and time when the redemption occurred.", example = "2026-04-11T09:15:00")
    @NotNull(message = "Redemption date is required")
    private LocalDateTime redemptionDate;

    @Size(max = 300, message = "Notes must not exceed 300 characters")
    private String notes;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getRewardId() {
        return rewardId;
    }

    public void setRewardId(Long rewardId) {
        this.rewardId = rewardId;
    }

    public LocalDateTime getRedemptionDate() {
        return redemptionDate;
    }

    public void setRedemptionDate(LocalDateTime redemptionDate) {
        this.redemptionDate = redemptionDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
