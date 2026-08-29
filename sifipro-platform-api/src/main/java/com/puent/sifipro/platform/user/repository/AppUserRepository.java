package com.puent.sifipro.platform.user.repository;

import java.util.Optional;
import com.puent.sifipro.platform.user.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Read-only access to the shared app_users table for platform login purposes.
 * This service does not create or modify AppUser rows.
 */
public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);
}
