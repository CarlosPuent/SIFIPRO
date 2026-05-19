package com.puent.sifipro.loyalty.entity;

import java.math.BigDecimal;
import com.puent.sifipro.shared.entity.BaseEntity;
import com.puent.sifipro.tenant.entity.Tenant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "program_config")
public class ProgramConfig extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String programName;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal pointsPerDollar;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal minimumPurchaseAmount;

    @Column(nullable = false)
    private Boolean active;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    public String getProgramName() {
        return programName;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public BigDecimal getPointsPerDollar() {
        return pointsPerDollar;
    }

    public void setPointsPerDollar(BigDecimal pointsPerDollar) {
        this.pointsPerDollar = pointsPerDollar;
    }

    public BigDecimal getMinimumPurchaseAmount() {
        return minimumPurchaseAmount;
    }

    public void setMinimumPurchaseAmount(BigDecimal minimumPurchaseAmount) {
        this.minimumPurchaseAmount = minimumPurchaseAmount;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }
}
