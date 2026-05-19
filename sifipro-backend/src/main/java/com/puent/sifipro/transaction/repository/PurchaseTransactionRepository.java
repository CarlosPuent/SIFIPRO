package com.puent.sifipro.transaction.repository;

import java.util.List;
import java.util.Optional;
import com.puent.sifipro.transaction.entity.PurchaseTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseTransactionRepository extends JpaRepository<PurchaseTransaction, Long> {

    Optional<PurchaseTransaction> findByIdAndTenantId(Long id, Long tenantId);

    List<PurchaseTransaction> findAllByTenantIdOrderByIdDesc(Long tenantId);

    List<PurchaseTransaction> findAllByTenantIdAndProgramConfigIdOrderByIdDesc(Long tenantId, Long programConfigId);

    List<PurchaseTransaction> findAllByCustomerIdAndTenantIdOrderByIdDesc(Long customerId, Long tenantId);

    List<PurchaseTransaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);

    List<PurchaseTransaction> findAllByOrderByTransactionDateDesc();
}
