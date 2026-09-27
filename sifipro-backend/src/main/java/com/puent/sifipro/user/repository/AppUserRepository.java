package com.puent.sifipro.user.repository;

import java.util.List;
import java.util.Optional;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    // Loads the tenant eagerly: used by the security layer, which runs outside any
    // transaction (open-in-view is disabled) and needs tenant.active per request.
    @EntityGraph(attributePaths = "tenant")
    Optional<AppUser> findWithTenantByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<AppUser> findAllByTenantIdOrderByIdAsc(Long tenantId);

    Optional<AppUser> findByIdAndTenantId(Long id, Long tenantId);

    long countByTenantIdAndRoleAndActiveTrue(Long tenantId, UserRole role);
}
