package com.puent.sifipro.reward.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class UpdateRewardRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must not exceed 120 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Required points is required")
    @Positive(message = "Required points must be positive")
    private BigDecimal requiredPoints;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock must be zero or positive")
    private Integer stock;

    @NotNull(message = "Program config id is required")
    private Long programConfigId;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

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

    public Long getProgramConfigId() {
        return programConfigId;
    }

    public void setProgramConfigId(Long programConfigId) {
        this.programConfigId = programConfigId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
