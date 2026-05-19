package com.puent.sifipro.transaction.controller;

import java.util.List;
import com.puent.sifipro.transaction.dto.CreatePurchaseTransactionRequest;
import com.puent.sifipro.transaction.dto.PointsMovementResponse;
import com.puent.sifipro.transaction.dto.PurchaseTransactionResponse;
import com.puent.sifipro.transaction.service.PurchaseTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Transactions", description = "Purchase transactions and points movement history endpoints.")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseTransactionController {

    private final PurchaseTransactionService purchaseTransactionService;

    public PurchaseTransactionController(PurchaseTransactionService purchaseTransactionService) {
        this.purchaseTransactionService = purchaseTransactionService;
    }

    @PostMapping
    @Operation(summary = "Create purchase transaction", description = "Registers a purchase transaction and awards points when rules are met.")
    public ResponseEntity<PurchaseTransactionResponse> createPurchaseTransaction(
            @Valid @RequestBody CreatePurchaseTransactionRequest request,
            Authentication authentication) {
        PurchaseTransactionResponse response = purchaseTransactionService.createPurchaseTransaction(
                request,
                authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List transactions", description = "Returns all purchase transactions ordered by transaction date descending.")
    public ResponseEntity<List<PurchaseTransactionResponse>> getAllTransactions(Authentication authentication) {
        List<PurchaseTransactionResponse> response = purchaseTransactionService
                .getAllTransactions(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/program/{programConfigId}")
    @Operation(summary = "List transactions by program", description = "Returns purchase transactions for a program ordered by newest id first.")
    public ResponseEntity<List<PurchaseTransactionResponse>> getTransactionsByProgram(
            @PathVariable Long programConfigId,
            Authentication authentication) {
        List<PurchaseTransactionResponse> response = purchaseTransactionService.getTransactionsByProgram(
                programConfigId,
                authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by id", description = "Returns a specific purchase transaction.")
    public ResponseEntity<PurchaseTransactionResponse> getTransactionById(
            @PathVariable Long id,
            Authentication authentication) {
        PurchaseTransactionResponse response = purchaseTransactionService.getTransactionById(id,
                authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "List customer transactions", description = "Returns purchase transactions for a customer ordered by transaction date descending.")
    public ResponseEntity<List<PurchaseTransactionResponse>> getTransactionsByCustomerId(
            @PathVariable Long customerId,
            Authentication authentication) {
        List<PurchaseTransactionResponse> response = purchaseTransactionService.getTransactionsByCustomerId(
                customerId,
                authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/points-movements")
    @Operation(summary = "List all points movements", description = "Returns all points movement ledger entries in the current tenant ordered by newest id first.")
    public ResponseEntity<List<PointsMovementResponse>> getAllPointsMovements(Authentication authentication) {
        List<PointsMovementResponse> response = purchaseTransactionService
                .getAllPointsMovements(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/program/{programConfigId}/points-movements")
    @Operation(summary = "List points movements by program", description = "Returns points movement ledger entries for a program ordered by newest id first.")
    public ResponseEntity<List<PointsMovementResponse>> getPointsMovementsByProgram(
            @PathVariable Long programConfigId,
            Authentication authentication) {
        List<PointsMovementResponse> response = purchaseTransactionService.getPointsMovementsByProgram(
                programConfigId,
                authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}/points-movements")
    @Operation(summary = "List customer points movements", description = "Returns points ledger history for a customer ordered by creation date descending.")
    public ResponseEntity<List<PointsMovementResponse>> getPointsMovementsByCustomerId(
            @PathVariable Long customerId,
            Authentication authentication) {
        List<PointsMovementResponse> response = purchaseTransactionService.getPointsMovementsByCustomerId(
                customerId,
                authentication.getName());
        return ResponseEntity.ok(response);
    }
}
