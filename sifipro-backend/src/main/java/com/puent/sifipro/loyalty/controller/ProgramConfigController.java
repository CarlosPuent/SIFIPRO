package com.puent.sifipro.loyalty.controller;

import java.util.List;
import com.puent.sifipro.loyalty.dto.CreateProgramConfigRequest;
import com.puent.sifipro.loyalty.dto.ProgramConfigResponse;
import com.puent.sifipro.loyalty.dto.UpdateProgramConfigRequest;
import com.puent.sifipro.loyalty.service.ProgramConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/program-config")
@Tag(name = "Program Configuration", description = "Loyalty program management endpoints scoped by tenant.")
@SecurityRequirement(name = "bearerAuth")
public class ProgramConfigController {

    private final ProgramConfigService programConfigService;

    public ProgramConfigController(ProgramConfigService programConfigService) {
        this.programConfigService = programConfigService;
    }

    @PostMapping
    @Operation(summary = "Create loyalty program", description = "Creates a new loyalty program for the authenticated tenant.")
    public ResponseEntity<ProgramConfigResponse> createProgramConfig(
            @Valid @RequestBody CreateProgramConfigRequest request,
            Authentication authentication) {
        ProgramConfigResponse response = programConfigService.createProgramConfig(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List loyalty programs", description = "Returns all loyalty programs from the authenticated tenant.")
    public ResponseEntity<List<ProgramConfigResponse>> getAllProgramConfigs(Authentication authentication) {
        List<ProgramConfigResponse> response = programConfigService.getAllProgramConfigs(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get loyalty program by id", description = "Returns one loyalty program by identifier within the authenticated tenant.")
    public ResponseEntity<ProgramConfigResponse> getProgramConfigById(
            @PathVariable Long id,
            Authentication authentication) {
        ProgramConfigResponse response = programConfigService.getProgramConfigById(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update loyalty program", description = "Updates an existing loyalty program from the authenticated tenant.")
    public ResponseEntity<ProgramConfigResponse> updateProgramConfig(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProgramConfigRequest request,
            Authentication authentication) {
        ProgramConfigResponse response = programConfigService.updateProgramConfig(id, request,
                authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate loyalty program", description = "Marks a loyalty program as active within the authenticated tenant.")
    public ResponseEntity<ProgramConfigResponse> activateProgramConfig(
            @PathVariable Long id,
            Authentication authentication) {
        ProgramConfigResponse response = programConfigService.activateProgramConfig(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate loyalty program", description = "Marks a loyalty program as inactive within the authenticated tenant.")
    public ResponseEntity<ProgramConfigResponse> deactivateProgramConfig(
            @PathVariable Long id,
            Authentication authentication) {
        ProgramConfigResponse response = programConfigService.deactivateProgramConfig(id, authentication.getName());
        return ResponseEntity.ok(response);
    }
}
