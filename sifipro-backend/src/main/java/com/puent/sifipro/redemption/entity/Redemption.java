package com.puent.sifipro.redemption.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.reward.entity.Reward;
import com.puent.sifipro.shared.entity.BaseEntity;
import com.puent.sifipro.tenant.entity.Tenant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "redemptions")
public class Redemption extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_config_id", nullable = false)
    private ProgramConfig programConfig;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal pointsUsed;

    @Column(nullable = false)
    private LocalDateTime redemptionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RedemptionStatus status;

    @Column(length = 300)
    private String notes;

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Reward getReward() {
        return reward;
    }

    public void setReward(Reward reward) {
        this.reward = reward;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public ProgramConfig getProgramConfig() {
        return programConfig;
    }

    public void setProgramConfig(ProgramConfig programConfig) {
        this.programConfig = programConfig;
    }

    public BigDecimal getPointsUsed() {
        return pointsUsed;
    }

    public void setPointsUsed(BigDecimal pointsUsed) {
        this.pointsUsed = pointsUsed;
    }

    public LocalDateTime getRedemptionDate() {
        return redemptionDate;
    }

    public void setRedemptionDate(LocalDateTime redemptionDate) {
        this.redemptionDate = redemptionDate;
    }

    public RedemptionStatus getStatus() {
        return status;
    }

    public void setStatus(RedemptionStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
