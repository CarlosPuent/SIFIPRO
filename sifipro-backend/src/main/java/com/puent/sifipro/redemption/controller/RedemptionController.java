package com.puent.sifipro.redemption.controller;

import java.util.List;
import com.puent.sifipro.redemption.dto.CreateRedemptionRequest;
import com.puent.sifipro.redemption.dto.RedemptionResponse;
import com.puent.sifipro.redemption.service.RedemptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/redemptions")
@Tag(name = "Redemptions", description = "Reward redemption endpoints.")
@SecurityRequirement(name = "bearerAuth")
public class RedemptionController {

    private final RedemptionService redemptionService;

    public RedemptionController(RedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    @PostMapping
    @Operation(summary = "Create redemption", description = "Consumes customer points to redeem a reward and records the movement.")
    public ResponseEntity<RedemptionResponse> createRedemption(
            @Valid @RequestBody CreateRedemptionRequest request,
            Authentication authentication) {
        RedemptionResponse response = redemptionService.createRedemption(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List redemptions", description = "Returns all redemptions ordered by redemption date descending.")
    public ResponseEntity<List<RedemptionResponse>> getAllRedemptions(Authentication authentication) {
        List<RedemptionResponse> response = redemptionService.getAllRedemptions(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get redemption by id", description = "Returns a specific redemption record.")
    public ResponseEntity<RedemptionResponse> getRedemptionById(
            @PathVariable Long id,
            Authentication authentication) {
        RedemptionResponse response = redemptionService.getRedemptionById(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "List customer redemptions", description = "Returns redemption history for a customer.")
    public ResponseEntity<List<RedemptionResponse>> getRedemptionsByCustomerId(
            @PathVariable Long customerId,
            Authentication authentication) {
        List<RedemptionResponse> response = redemptionService.getRedemptionsByCustomerId(
                customerId,
                authentication.getName());
        return ResponseEntity.ok(response);
    }
}
