package com.puent.sifipro.customer.repository;

import java.util.List;
import java.util.Optional;
import com.puent.sifipro.customer.entity.Customer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndTenantId(String email, Long tenantId);

    List<Customer> findAllByTenantIdOrderByIdDesc(Long tenantId);

    Optional<Customer> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Customer> findByEmailIgnoreCaseAndTenantId(String email, Long tenantId);

    // Used by the portal security filter, which runs outside any transaction and needs
    // tenant.active on every request (same reason as AppUserRepository).
    @EntityGraph(attributePaths = "tenant")
    Optional<Customer> findWithTenantById(Long id);
}
