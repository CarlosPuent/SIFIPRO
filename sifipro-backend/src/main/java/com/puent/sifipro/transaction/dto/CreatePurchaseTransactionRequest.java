package com.puent.sifipro.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to register a purchase transaction.")
public class CreatePurchaseTransactionRequest {

    @Schema(description = "Identifier of the purchasing customer.", example = "1")
    @NotNull(message = "Customer id is required")
    private Long customerId;

    @Schema(description = "Identifier of the loyalty program used for this purchase.", example = "1")
    @NotNull(message = "Program config id is required")
    private Long programConfigId;

    @Schema(description = "Purchase amount in currency units.", example = "150.00")
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @Size(max = 300, message = "Description must not exceed 300 characters")
    private String description;

    @Schema(description = "Date and time when the purchase happened.", example = "2026-04-10T14:30:00")
    @NotNull(message = "Transaction date is required")
    private LocalDateTime transactionDate;

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
}
