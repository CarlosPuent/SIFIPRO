package com.puent.sifipro.audit.controller;

import java.time.LocalDate;
import com.puent.sifipro.audit.dto.AuditPageResponse;
import com.puent.sifipro.audit.service.AuditService;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit log", description = "Points audit log of the authenticated tenant (ADMIN only).")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/points-movements")
    @Operation(summary = "Points audit log",
            description = "Every points grant (EARN), redemption (REDEEM) and manual adjustment (ADJUSTMENT) of the "
                    + "authenticated tenant, newest first, with customer, program, signed points, reference, the user "
                    + "who registered it and the adjustment reason. Always limited to the caller's tenant; filters "
                    + "only narrow the result.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Page of movements."),
            @ApiResponse(responseCode = "400", description = "Invalid filter (e.g. 'from' after 'to', unknown type)."),
            @ApiResponse(responseCode = "403", description = "Only ADMIN can read the audit log.")
    })
    public ResponseEntity<AuditPageResponse> getPointsMovements(
            @Parameter(description = "Start date, inclusive (yyyy-MM-dd).")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date, inclusive (yyyy-MM-dd).")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "Movement type: EARN, REDEEM or ADJUSTMENT.")
            @RequestParam(required = false) PointsMovementType type,
            @Parameter(description = "Only movements of this customer.") @RequestParam(required = false) Long customerId,
            @Parameter(description = "Only movements registered by this internal user.") @RequestParam(required = false) Long userId,
            @Parameter(description = "Zero-based page. Default 0.") @RequestParam(required = false) Integer page,
            @Parameter(description = "Page size (1-100). Default 20.") @RequestParam(required = false) Integer size,
            Authentication authentication) {
        return ResponseEntity.ok(auditService.getPointsMovements(
                from, to, type, customerId, userId, page, size, authentication.getName()));
    }
}
