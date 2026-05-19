package com.puent.sifipro.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Full customer profile for the premium Customer Profile screen.")
public class CustomerProfileResponse {

    // --- Identity ---
    @Schema(description = "Customer identifier.", example = "1")
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Boolean active;

    @Schema(description = "Date the customer joined the loyalty program.")
    private LocalDateTime memberSince;

    // --- Points & Tier ---
    @Schema(description = "Current points balance.", example = "750.0000")
    private BigDecimal pointsBalance;

    @Schema(description = "Loyalty tier: BRONZE, SILVER, or GOLD.", example = "SILVER")
    private String tier;

    @Schema(description = "Progress toward the next tier.")
    private CustomerTierProgressResponse tierProgress;

    // --- Stats ---
    @Schema(description = "Lifetime activity statistics.")
    private CustomerStatsResponse stats;

    // --- Recent Activity ---
    @Schema(description = "Up to 5 most recent purchase transactions.")
    private List<CustomerProfileRecentTransactionResponse> recentTransactions;

    @Schema(description = "Up to 3 most recent redemptions.")
    private List<CustomerProfileRecentRedemptionResponse> recentRedemptions;

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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getMemberSince() {
        return memberSince;
    }

    public void setMemberSince(LocalDateTime memberSince) {
        this.memberSince = memberSince;
    }

    public BigDecimal getPointsBalance() {
        return pointsBalance;
    }

    public void setPointsBalance(BigDecimal pointsBalance) {
        this.pointsBalance = pointsBalance;
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

    public CustomerStatsResponse getStats() {
        return stats;
    }

    public void setStats(CustomerStatsResponse stats) {
        this.stats = stats;
    }

    public List<CustomerProfileRecentTransactionResponse> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<CustomerProfileRecentTransactionResponse> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }

    public List<CustomerProfileRecentRedemptionResponse> getRecentRedemptions() {
        return recentRedemptions;
    }

    public void setRecentRedemptions(List<CustomerProfileRecentRedemptionResponse> recentRedemptions) {
        this.recentRedemptions = recentRedemptions;
    }
}
