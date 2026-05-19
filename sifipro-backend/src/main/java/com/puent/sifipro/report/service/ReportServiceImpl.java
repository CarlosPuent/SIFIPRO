package com.puent.sifipro.report.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.redemption.entity.Redemption;
import com.puent.sifipro.redemption.repository.RedemptionRepository;
import com.puent.sifipro.report.dto.DashboardSummaryResponse;
import com.puent.sifipro.report.dto.TopCustomerResponse;
import com.puent.sifipro.report.dto.TopRedeemedRewardResponse;
import com.puent.sifipro.reward.entity.Reward;
import com.puent.sifipro.reward.repository.RewardRepository;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.transaction.repository.PurchaseTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportServiceImpl implements ReportService {

    private static final int TOP_LIMIT = 5;

    private final CustomerRepository customerRepository;
    private final RewardRepository rewardRepository;
    private final PurchaseTransactionRepository purchaseTransactionRepository;
    private final RedemptionRepository redemptionRepository;
    private final PointsMovementRepository pointsMovementRepository;

    public ReportServiceImpl(
            CustomerRepository customerRepository,
            RewardRepository rewardRepository,
            PurchaseTransactionRepository purchaseTransactionRepository,
            RedemptionRepository redemptionRepository,
            PointsMovementRepository pointsMovementRepository) {
        this.customerRepository = customerRepository;
        this.rewardRepository = rewardRepository;
        this.purchaseTransactionRepository = purchaseTransactionRepository;
        this.redemptionRepository = redemptionRepository;
        this.pointsMovementRepository = pointsMovementRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        DashboardSummaryResponse response = new DashboardSummaryResponse();
        response.setTotalCustomers(customerRepository.count());
        response.setTotalActiveCustomers(countActiveCustomers());
        response.setTotalRewards(rewardRepository.count());
        response.setTotalActiveRewards(countActiveRewards());
        response.setTotalTransactions(purchaseTransactionRepository.count());
        response.setTotalRedemptions(redemptionRepository.count());
        response.setTotalPointsIssued(sumPointsByType(PointsMovementType.EARN));
        response.setTotalPointsRedeemed(sumPointsByType(PointsMovementType.REDEEM));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopCustomerResponse> getTopCustomers() {
        return customerRepository.findAll()
                .stream()
                .sorted(Comparator
                        .comparing(this::safePointsBalance)
                        .reversed())
                .limit(TOP_LIMIT)
                .map(this::toTopCustomerResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopRedeemedRewardResponse> getTopRedeemedRewards() {
        Map<Long, RewardAggregate> rewardAggregates = new HashMap<>();

        for (Redemption redemption : redemptionRepository.findAll()) {
            Reward reward = redemption.getReward();
            if (reward == null || reward.getId() == null) {
                continue;
            }

            RewardAggregate aggregate = rewardAggregates.computeIfAbsent(
                    reward.getId(),
                    rewardId -> new RewardAggregate(rewardId, reward.getName()));
            aggregate.incrementRedemptions();
        }

        return rewardAggregates.values()
                .stream()
                .sorted(Comparator.comparing(RewardAggregate::getTotalRedemptions).reversed())
                .limit(TOP_LIMIT)
                .map(this::toTopRedeemedRewardResponse)
                .toList();
    }

    private long countActiveCustomers() {
        return customerRepository.findAll()
                .stream()
                .filter(customer -> Boolean.TRUE.equals(customer.getActive()))
                .count();
    }

    private long countActiveRewards() {
        return rewardRepository.findAll()
                .stream()
                .filter(reward -> Boolean.TRUE.equals(reward.getActive()))
                .count();
    }

    private BigDecimal sumPointsByType(PointsMovementType type) {
        return pointsMovementRepository.findAll()
                .stream()
                .filter(movement -> type == movement.getType())
                .map(PointsMovement::getPoints)
                .filter(points -> points != null)
                .map(points -> (type == PointsMovementType.REDEEM || type == PointsMovementType.EXPIRE)
                        ? points.abs()
                        : points)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal safePointsBalance(Customer customer) {
        return customer.getPointsBalance() == null ? BigDecimal.ZERO : customer.getPointsBalance();
    }

    private TopCustomerResponse toTopCustomerResponse(Customer customer) {
        TopCustomerResponse response = new TopCustomerResponse();
        response.setCustomerId(customer.getId());
        response.setCustomerFullName((customer.getFirstName() + " " + customer.getLastName()).trim());
        response.setEmail(customer.getEmail());
        response.setPointsBalance(safePointsBalance(customer));
        response.setActive(customer.getActive());
        return response;
    }

    private TopRedeemedRewardResponse toTopRedeemedRewardResponse(RewardAggregate aggregate) {
        TopRedeemedRewardResponse response = new TopRedeemedRewardResponse();
        response.setRewardId(aggregate.getRewardId());
        response.setRewardName(aggregate.getRewardName());
        response.setTotalRedemptions(aggregate.getTotalRedemptions());
        return response;
    }

    private static class RewardAggregate {

        private final Long rewardId;
        private final String rewardName;
        private long totalRedemptions;

        private RewardAggregate(Long rewardId, String rewardName) {
            this.rewardId = rewardId;
            this.rewardName = rewardName;
            this.totalRedemptions = 0;
        }

        private void incrementRedemptions() {
            this.totalRedemptions++;
        }

        private Long getRewardId() {
            return rewardId;
        }

        private String getRewardName() {
            return rewardName;
        }

        private long getTotalRedemptions() {
            return totalRedemptions;
        }
    }
}
