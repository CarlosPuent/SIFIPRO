package com.puent.sifipro.transaction.repository;

import java.util.List;
import com.puent.sifipro.transaction.entity.PointsMovement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointsMovementRepository extends JpaRepository<PointsMovement, Long> {

    List<PointsMovement> findAllByTenantIdOrderByIdDesc(Long tenantId);

    List<PointsMovement> findAllByTenantIdAndProgramConfigIdOrderByIdDesc(Long tenantId, Long programConfigId);

    List<PointsMovement> findAllByCustomerIdAndTenantIdAndProgramConfigIdOrderByIdAsc(
            Long customerId,
            Long tenantId,
            Long programConfigId);

    List<PointsMovement> findAllByCustomerIdAndTenantIdOrderByIdDesc(Long customerId, Long tenantId);

    List<PointsMovement> findAllByCustomerIdAndTenantIdOrderByIdAsc(Long customerId, Long tenantId);

    List<PointsMovement> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
