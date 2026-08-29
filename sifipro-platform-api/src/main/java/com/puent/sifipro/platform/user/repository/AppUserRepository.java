package com.puent.sifipro.platform.user.repository;

import java.util.Optional;
import com.puent.sifipro.platform.user.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Access to the shared app_users table: reads for platform login, and writes for
 * creating a tenant's initial ADMIN user as part of TenantServiceImpl.createTenant().
 */
public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
