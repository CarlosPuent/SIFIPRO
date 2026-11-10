package com.puent.sifipro.customer.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.puent.sifipro.shared.entity.BaseEntity;
import com.puent.sifipro.tenant.entity.Tenant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "customers")
public class Customer extends BaseEntity {

    @Version
    private Long version;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal pointsBalance;

    @Column(nullable = false)
    private Boolean active;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    // RF-08 · BCrypt hash of the self-service portal password; null = no portal access (V5).
    @Column(name = "portal_password_hash", length = 255)
    private String portalPasswordHash;

    @Column(name = "portal_last_login_at")
    private LocalDateTime portalLastLoginAt;

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
        if (pointsBalance == null || pointsBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Points balance cannot be null or negative.");
        }
        this.pointsBalance = pointsBalance;
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

    public Long getVersion() {
        return version;
    }

    public String getPortalPasswordHash() {
        return portalPasswordHash;
    }

    public void setPortalPasswordHash(String portalPasswordHash) {
        this.portalPasswordHash = portalPasswordHash;
    }

    public LocalDateTime getPortalLastLoginAt() {
        return portalLastLoginAt;
    }

    public void setPortalLastLoginAt(LocalDateTime portalLastLoginAt) {
        this.portalLastLoginAt = portalLastLoginAt;
    }

    public boolean isPortalEnabled() {
        return portalPasswordHash != null;
    }
}
