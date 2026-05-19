package com.puent.sifipro.reward.repository;

import java.util.List;
import java.util.Optional;
import com.puent.sifipro.reward.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RewardRepository extends JpaRepository<Reward, Long> {

    boolean existsByNameIgnoreCase(String name);

    List<Reward> findAllByTenantIdOrderByIdDesc(Long tenantId);

    List<Reward> findAllByTenantIdAndProgramConfigIdOrderByIdDesc(Long tenantId, Long programConfigId);

    Optional<Reward> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Reward> findByIdAndTenantIdAndProgramConfigId(Long id, Long tenantId, Long programConfigId);

    boolean existsByNameIgnoreCaseAndProgramConfigId(String name, Long programConfigId);
}
