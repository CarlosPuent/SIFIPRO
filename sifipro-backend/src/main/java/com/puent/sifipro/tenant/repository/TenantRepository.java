package com.puent.sifipro.tenant.repository;

import java.util.Optional;
import com.puent.sifipro.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
