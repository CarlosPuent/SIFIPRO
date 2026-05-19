package com.puent.sifipro.reward.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Reward representation returned by the API.")
public class RewardResponse {

    @Schema(description = "Reward identifier.", example = "1")
    private Long id;
    private String name;
    private String description;
    @Schema(description = "Points required for redemption.", example = "120.0000")
    private BigDecimal requiredPoints;
    @Schema(description = "Current available stock.", example = "19")
    private Integer stock;
    private Boolean active;
    private Long programConfigId;
    private String programName;
    @Schema(description = "Optional URL of the reward image.", example = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400")
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getRequiredPoints() {
        return requiredPoints;
    }

    public void setRequiredPoints(BigDecimal requiredPoints) {
        this.requiredPoints = requiredPoints;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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
