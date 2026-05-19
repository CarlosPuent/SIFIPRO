package com.puent.sifipro.transaction.service;

import java.util.List;
import com.puent.sifipro.transaction.dto.CreatePurchaseTransactionRequest;
import com.puent.sifipro.transaction.dto.PointsMovementResponse;
import com.puent.sifipro.transaction.dto.PurchaseTransactionResponse;

public interface PurchaseTransactionService {

    PurchaseTransactionResponse createPurchaseTransaction(CreatePurchaseTransactionRequest request,
            String currentUserEmail);

    List<PurchaseTransactionResponse> getAllTransactions(String currentUserEmail);

    List<PurchaseTransactionResponse> getTransactionsByProgram(Long programConfigId, String currentUserEmail);

    PurchaseTransactionResponse getTransactionById(Long id, String currentUserEmail);

    List<PurchaseTransactionResponse> getTransactionsByCustomerId(Long customerId, String currentUserEmail);

    List<PointsMovementResponse> getAllPointsMovements(String currentUserEmail);

    List<PointsMovementResponse> getPointsMovementsByProgram(Long programConfigId, String currentUserEmail);

    List<PointsMovementResponse> getPointsMovementsByCustomerId(Long customerId, String currentUserEmail);
}
