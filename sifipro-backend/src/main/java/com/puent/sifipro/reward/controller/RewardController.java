package com.puent.sifipro.reward.controller;

import java.util.List;
import com.puent.sifipro.reward.dto.CreateRewardRequest;
import com.puent.sifipro.reward.dto.RewardResponse;
import com.puent.sifipro.reward.dto.UpdateRewardRequest;
import com.puent.sifipro.reward.service.RewardService;
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
@RequestMapping("/api/rewards")
@Tag(name = "Rewards", description = "Reward catalog management endpoints.")
@SecurityRequirement(name = "bearerAuth")
public class RewardController {

    private final RewardService rewardService;

    public RewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    @PostMapping
    @Operation(summary = "Create reward", description = "Creates a new reward available for redemption.")
    public ResponseEntity<RewardResponse> createReward(
            @Valid @RequestBody CreateRewardRequest request,
            Authentication authentication) {
        RewardResponse response = rewardService.createReward(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List rewards", description = "Returns all rewards in the catalog.")
    public ResponseEntity<List<RewardResponse>> getAllRewards(Authentication authentication) {
        List<RewardResponse> response = rewardService.getAllRewards(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/programs/{programConfigId}")
    @Operation(summary = "List rewards by program", description = "Returns rewards for one loyalty program in the authenticated tenant.")
    public ResponseEntity<List<RewardResponse>> getRewardsByProgram(
            @PathVariable Long programConfigId,
            Authentication authentication) {
        List<RewardResponse> response = rewardService.getRewardsByProgram(programConfigId, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get reward by id", description = "Returns reward detail for a specific identifier.")
    public ResponseEntity<RewardResponse> getRewardById(@PathVariable Long id, Authentication authentication) {
        RewardResponse response = rewardService.getRewardById(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update reward", description = "Updates editable reward fields.")
    public ResponseEntity<RewardResponse> updateReward(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRewardRequest request,
            Authentication authentication) {
        RewardResponse response = rewardService.updateReward(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate reward", description = "Marks a reward as active and redeemable.")
    public ResponseEntity<RewardResponse> activateReward(@PathVariable Long id, Authentication authentication) {
        RewardResponse response = rewardService.activateReward(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate reward", description = "Marks a reward as inactive.")
    public ResponseEntity<RewardResponse> deactivateReward(@PathVariable Long id, Authentication authentication) {
        RewardResponse response = rewardService.deactivateReward(id, authentication.getName());
        return ResponseEntity.ok(response);
    }
}
