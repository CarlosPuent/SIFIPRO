package com.puent.sifipro.loyalty.repository;

import java.util.List;
import java.util.Optional;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramConfigRepository extends JpaRepository<ProgramConfig, Long> {

    Optional<ProgramConfig> findFirstByOrderByIdAsc();

    List<ProgramConfig> findAllByTenantIdOrderByIdDesc(Long tenantId);

    Optional<ProgramConfig> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByProgramNameIgnoreCaseAndTenantId(String programName, Long tenantId);
}
