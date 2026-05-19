package com.puent.sifipro.redemption.service;

import java.util.List;
import com.puent.sifipro.redemption.dto.CreateRedemptionRequest;
import com.puent.sifipro.redemption.dto.RedemptionResponse;

public interface RedemptionService {

    RedemptionResponse createRedemption(CreateRedemptionRequest request, String currentUserEmail);

    List<RedemptionResponse> getAllRedemptions(String currentUserEmail);

    RedemptionResponse getRedemptionById(Long id, String currentUserEmail);

    List<RedemptionResponse> getRedemptionsByCustomerId(Long customerId, String currentUserEmail);
}
