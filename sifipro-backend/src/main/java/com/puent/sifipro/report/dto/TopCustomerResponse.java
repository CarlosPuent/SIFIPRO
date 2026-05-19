package com.puent.sifipro.report.dto;

import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Ranking entry for customers with highest points balances.")
public class TopCustomerResponse {

    @Schema(description = "Customer identifier.", example = "2")
    private Long customerId;
    private String customerFullName;
    private String email;
    @Schema(description = "Current points balance.", example = "275.0000")
    private BigDecimal pointsBalance;
    private Boolean active;

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public BigDecimal getPointsBalance() {
        return pointsBalance;
    }

    public void setPointsBalance(BigDecimal pointsBalance) {
        this.pointsBalance = pointsBalance;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
