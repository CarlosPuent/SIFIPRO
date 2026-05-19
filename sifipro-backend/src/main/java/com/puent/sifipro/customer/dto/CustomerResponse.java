package com.puent.sifipro.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Customer representation returned by the API.")
public class CustomerResponse {

    @Schema(description = "Customer identifier.", example = "1")
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    @Schema(description = "Current customer points balance.", example = "145.2500")
    private BigDecimal pointsBalance;
    private Boolean active;

    @Schema(description = "Customer loyalty tier based on current points balance.", example = "SILVER",
            allowableValues = {"BRONZE", "SILVER", "GOLD"})
    private String tier;

    @Schema(description = "Tier progress details for the frontend progress bar.")
    private CustomerTierProgressResponse tierProgress;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public CustomerTierProgressResponse getTierProgress() {
        return tierProgress;
    }

    public void setTierProgress(CustomerTierProgressResponse tierProgress) {
        this.tierProgress = tierProgress;
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
