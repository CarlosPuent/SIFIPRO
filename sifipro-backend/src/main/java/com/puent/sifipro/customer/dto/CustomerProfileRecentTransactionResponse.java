package com.puent.sifipro.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Compact purchase transaction entry for the customer profile activity feed.")
public class CustomerProfileRecentTransactionResponse {

    @Schema(description = "Transaction identifier.", example = "10")
    private Long id;

    @Schema(description = "Purchase amount.", example = "150.00")
    private BigDecimal amount;

    @Schema(description = "Points awarded from this transaction.", example = "225.0000")
    private BigDecimal pointsEarned;

    @Schema(description = "Transaction description.", example = "In-store purchase")
    private String description;

    @Schema(description = "Date and time of the transaction.")
    private LocalDateTime transactionDate;

    @Schema(description = "Loyalty program name.", example = "VIP Rewards")
    private String programName;

    @Schema(description = "Identifier of the internal user who registered this transaction.", example = "3")
    private Long createdBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getPointsEarned() {
        return pointsEarned;
    }

    public void setPointsEarned(BigDecimal pointsEarned) {
        this.pointsEarned = pointsEarned;
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
