package com.puent.sifipro.transaction.entity;

import java.math.BigDecimal;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
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
@Table(name = "points_movements")
public class PointsMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_config_id", nullable = false)
    private ProgramConfig programConfig;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PointsMovementType type;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal points;

    @Column(length = 300)
    private String description;

    @Column(nullable = false, length = 50)
    private String referenceType;

    @Column(nullable = false)
    private Long referenceId;

    @Column(name = "created_by")
    private Long createdBy;

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
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

    public PointsMovementType getType() {
        return type;
    }

    public void setType(PointsMovementType type) {
        this.type = type;
    }

    public BigDecimal getPoints() {
        return points;
    }

    public void setPoints(BigDecimal points) {
        this.points = points;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}
