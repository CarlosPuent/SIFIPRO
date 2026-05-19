package com.puent.sifipro.report.service;

import java.util.List;
import com.puent.sifipro.report.dto.DashboardSummaryResponse;
import com.puent.sifipro.report.dto.TopCustomerResponse;
import com.puent.sifipro.report.dto.TopRedeemedRewardResponse;

public interface ReportService {

    DashboardSummaryResponse getDashboardSummary();

    List<TopCustomerResponse> getTopCustomers();

    List<TopRedeemedRewardResponse> getTopRedeemedRewards();
}
