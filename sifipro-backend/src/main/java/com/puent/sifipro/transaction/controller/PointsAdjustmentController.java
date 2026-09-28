package com.puent.sifipro.transaction.controller;

import com.puent.sifipro.transaction.dto.CreatePointsAdjustmentRequest;
import com.puent.sifipro.transaction.dto.PointsAdjustmentResponse;
import com.puent.sifipro.transaction.service.PointsAdjustmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers/{customerId}/adjustments")
@Tag(name = "Points adjustments", description = "Manual points corrections made by an ADMIN and recorded in the audit log.")
@SecurityRequirement(name = "bearerAuth")
public class PointsAdjustmentController {

    private final PointsAdjustmentService pointsAdjustmentService;

    public PointsAdjustmentController(PointsAdjustmentService pointsAdjustmentService) {
        this.pointsAdjustmentService = pointsAdjustmentService;
    }

    @PostMapping
    @Operation(summary = "Adjust customer points (ADMIN)",
            description = "Adds (positive) or removes (negative) points of a customer in one program. Creates an "
                    + "ADJUSTMENT movement with the author and the reason, and updates the customer's balance. "
                    + "Adjustments are not counted as points issued or redeemed in reports.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Adjustment applied."),
            @ApiResponse(responseCode = "400", description = "Invalid data (points = 0, reason shorter than 5 "
                    + "characters) or the adjustment would leave the global or program balance negative."),
            @ApiResponse(responseCode = "403", description = "Only ADMIN can adjust points."),
            @ApiResponse(responseCode = "404", description = "Customer or program not found in the tenant."),
            @ApiResponse(responseCode = "409", description = "Concurrent update of the same customer; retry.")
    })
    public ResponseEntity<PointsAdjustmentResponse> createAdjustment(
            @PathVariable Long customerId,
            @Valid @RequestBody CreatePointsAdjustmentRequest request,
            Authentication authentication) {
        PointsAdjustmentResponse response =
                pointsAdjustmentService.createAdjustment(customerId, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
