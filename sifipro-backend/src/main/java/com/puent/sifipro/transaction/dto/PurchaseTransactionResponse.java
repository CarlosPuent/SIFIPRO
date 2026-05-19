package com.puent.sifipro.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Purchase transaction representation returned by the API.")
public class PurchaseTransactionResponse {

    @Schema(description = "Transaction identifier.", example = "10")
    private Long id;

    @Schema(description = "Identifier of the customer.", example = "1")
    private Long customerId;

    @Schema(description = "Identifier of the loyalty program used for this purchase.", example = "1")
    private Long programConfigId;

    @Schema(description = "Loyalty program name used for this purchase.", example = "VIP Rewards")
    private String programName;

    private String customerFullName;
    private BigDecimal amount;
    private String description;
    private LocalDateTime transactionDate;

    @Schema(description = "Points earned from this transaction.", example = "187.5000")
    private BigDecimal pointsEarned;

    @Schema(description = "Points awarded from this transaction.", example = "187.5000")
    private BigDecimal awardedPoints;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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

    public String getCustomerFullName() {
        return customerFullName;
    }

    public void setCustomerFullName(String customerFullName) {
        this.customerFullName = customerFullName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }

    public BigDecimal getPointsEarned() {
        return pointsEarned;
    }

    public void setPointsEarned(BigDecimal pointsEarned) {
        this.pointsEarned = pointsEarned;
    }

    public BigDecimal getAwardedPoints() {
        return awardedPoints;
    }

    public void setAwardedPoints(BigDecimal awardedPoints) {
        this.awardedPoints = awardedPoints;
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
