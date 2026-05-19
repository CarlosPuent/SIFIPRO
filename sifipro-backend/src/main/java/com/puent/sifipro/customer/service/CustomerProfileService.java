package com.puent.sifipro.customer.service;

import java.util.List;
import com.puent.sifipro.customer.dto.CustomerProfileResponse;
import com.puent.sifipro.customer.dto.PointsHistoryEntryResponse;

public interface CustomerProfileService {

    CustomerProfileResponse getCustomerProfile(Long customerId, String currentUserEmail);

    List<PointsHistoryEntryResponse> getPointsHistory(Long customerId, String currentUserEmail);
}
