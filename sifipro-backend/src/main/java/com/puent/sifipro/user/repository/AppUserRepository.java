package com.puent.sifipro.user.repository;

import java.util.List;
import java.util.Optional;
import com.puent.sifipro.user.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<AppUser> findAllByTenantIdOrderByIdAsc(Long tenantId);

    Optional<AppUser> findByIdAndTenantId(Long id, Long tenantId);
}
