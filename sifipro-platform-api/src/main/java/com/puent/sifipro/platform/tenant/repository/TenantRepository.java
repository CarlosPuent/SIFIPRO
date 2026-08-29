package com.puent.sifipro.platform.tenant.repository;

import com.puent.sifipro.platform.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    boolean existsByCodeIgnoreCase(String code);
}
