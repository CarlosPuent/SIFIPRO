package com.puent.sifipro.reward.service;

import java.util.List;
import com.puent.sifipro.reward.dto.CreateRewardRequest;
import com.puent.sifipro.reward.dto.RewardResponse;
import com.puent.sifipro.reward.dto.UpdateRewardRequest;

public interface RewardService {

    RewardResponse createReward(CreateRewardRequest request, String currentUserEmail);

    List<RewardResponse> getAllRewards(String currentUserEmail);

    List<RewardResponse> getRewardsByProgram(Long programConfigId, String currentUserEmail);

    RewardResponse getRewardById(Long id, String currentUserEmail);

    RewardResponse updateReward(Long id, UpdateRewardRequest request, String currentUserEmail);

    RewardResponse activateReward(Long id, String currentUserEmail);

    RewardResponse deactivateReward(Long id, String currentUserEmail);
}
