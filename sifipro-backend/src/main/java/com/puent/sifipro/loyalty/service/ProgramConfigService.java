package com.puent.sifipro.loyalty.service;

import java.util.List;
import com.puent.sifipro.loyalty.dto.CreateProgramConfigRequest;
import com.puent.sifipro.loyalty.dto.ProgramConfigResponse;
import com.puent.sifipro.loyalty.dto.UpdateProgramConfigRequest;

public interface ProgramConfigService {

    ProgramConfigResponse createProgramConfig(CreateProgramConfigRequest request, String currentUserEmail);

    List<ProgramConfigResponse> getAllProgramConfigs(String currentUserEmail);

    ProgramConfigResponse getProgramConfigById(Long id, String currentUserEmail);

    ProgramConfigResponse updateProgramConfig(Long id, UpdateProgramConfigRequest request, String currentUserEmail);

    ProgramConfigResponse activateProgramConfig(Long id, String currentUserEmail);

    ProgramConfigResponse deactivateProgramConfig(Long id, String currentUserEmail);
}
