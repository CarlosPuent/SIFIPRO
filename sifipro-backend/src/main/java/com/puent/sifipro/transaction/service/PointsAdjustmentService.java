package com.puent.sifipro.transaction.service;

import com.puent.sifipro.transaction.dto.CreatePointsAdjustmentRequest;
import com.puent.sifipro.transaction.dto.PointsAdjustmentResponse;

public interface PointsAdjustmentService {

    PointsAdjustmentResponse createAdjustment(Long customerId, CreatePointsAdjustmentRequest request, String currentUserEmail);
}
