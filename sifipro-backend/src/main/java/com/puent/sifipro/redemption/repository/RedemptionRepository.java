package com.puent.sifipro.redemption.repository;

import java.util.List;
import java.util.Optional;
import com.puent.sifipro.redemption.entity.Redemption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RedemptionRepository extends JpaRepository<Redemption, Long> {

    List<Redemption> findAllByTenantIdOrderByIdDesc(Long tenantId);

    Optional<Redemption> findByIdAndTenantId(Long id, Long tenantId);

    List<Redemption> findAllByCustomerIdAndTenantIdOrderByIdDesc(Long customerId, Long tenantId);
}
