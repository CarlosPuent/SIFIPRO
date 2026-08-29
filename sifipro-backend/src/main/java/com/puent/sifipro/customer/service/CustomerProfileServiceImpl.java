package com.puent.sifipro.customer.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import com.puent.sifipro.customer.CustomerTier;
import com.puent.sifipro.customer.dto.CustomerProfileRecentRedemptionResponse;
import com.puent.sifipro.customer.dto.CustomerProfileRecentTransactionResponse;
import com.puent.sifipro.customer.dto.CustomerProfileResponse;
import com.puent.sifipro.customer.dto.CustomerStatsResponse;
import com.puent.sifipro.customer.dto.CustomerTierProgressResponse;
import com.puent.sifipro.customer.dto.PointsHistoryEntryResponse;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.redemption.entity.Redemption;
import com.puent.sifipro.redemption.repository.RedemptionRepository;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.entity.PurchaseTransaction;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.transaction.repository.PurchaseTransactionRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerProfileServiceImpl implements CustomerProfileService {

    private static final int RECENT_TRANSACTIONS_LIMIT = 5;
    private static final int RECENT_REDEMPTIONS_LIMIT = 3;

    private final CustomerRepository customerRepository;
    private final AppUserRepository appUserRepository;
    private final PurchaseTransactionRepository purchaseTransactionRepository;
    private final RedemptionRepository redemptionRepository;
    private final PointsMovementRepository pointsMovementRepository;

    public CustomerProfileServiceImpl(
            CustomerRepository customerRepository,
            AppUserRepository appUserRepository,
            PurchaseTransactionRepository purchaseTransactionRepository,
            RedemptionRepository redemptionRepository,
            PointsMovementRepository pointsMovementRepository) {
        this.customerRepository = customerRepository;
        this.appUserRepository = appUserRepository;
        this.purchaseTransactionRepository = purchaseTransactionRepository;
        this.redemptionRepository = redemptionRepository;
        this.pointsMovementRepository = pointsMovementRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerProfileResponse getCustomerProfile(Long customerId, String currentUserEmail) {
        Long tenantId = resolveAuthenticatedTenantId(currentUserEmail);
        Customer customer = findCustomerByIdAndTenantId(customerId, tenantId);

        List<PurchaseTransaction> transactions =
                purchaseTransactionRepository.findAllByCustomerIdAndTenantIdOrderByIdDesc(customerId, tenantId);
        List<Redemption> redemptions =
                redemptionRepository.findAllByCustomerIdAndTenantIdOrderByIdDesc(customerId, tenantId);

        return buildProfileResponse(customer, transactions, redemptions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PointsHistoryEntryResponse> getPointsHistory(Long customerId, String currentUserEmail) {
        Long tenantId = resolveAuthenticatedTenantId(currentUserEmail);
        findCustomerByIdAndTenantId(customerId, tenantId);

        List<PointsMovement> movements =
                pointsMovementRepository.findAllByCustomerIdAndTenantIdOrderByIdAsc(customerId, tenantId);

        return buildPointsHistory(movements);
    }

    // --- builders ---

    private CustomerProfileResponse buildProfileResponse(
            Customer customer,
            List<PurchaseTransaction> transactions,
            List<Redemption> redemptions) {

        BigDecimal points = safePoints(customer.getPointsBalance());
        CustomerTier tier = CustomerTier.fromPoints(points);

        CustomerProfileResponse response = new CustomerProfileResponse();
        response.setId(customer.getId());
        response.setFirstName(customer.getFirstName());
        response.setLastName(customer.getLastName());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        response.setActive(customer.getActive());
        response.setMemberSince(customer.getCreatedAt());
        response.setPointsBalance(points);
        response.setTier(tier.name());
        response.setTierProgress(buildTierProgress(tier, points));
        response.setStats(buildStats(transactions, redemptions));
        response.setRecentTransactions(buildRecentTransactions(transactions));
        response.setRecentRedemptions(buildRecentRedemptions(redemptions));

        return response;
    }

    private CustomerTierProgressResponse buildTierProgress(CustomerTier tier, BigDecimal currentPoints) {
        CustomerTierProgressResponse progress = new CustomerTierProgressResponse();
        progress.setCurrentTier(tier.name());

        CustomerTier nextTier = tier.next();
        progress.setNextTier(nextTier != null ? nextTier.name() : null);
        progress.setCurrentPoints(currentPoints);

        if (tier == CustomerTier.GOLD) {
            progress.setPointsForNextTier(null);
            progress.setPointsToNextTier(BigDecimal.ZERO);
            progress.setProgressPercentage(100.0);
        } else {
            BigDecimal pointsForNext = tier.getNextThreshold();
            BigDecimal toNext = pointsForNext.subtract(currentPoints);
            progress.setPointsForNextTier(pointsForNext);
            progress.setPointsToNextTier(toNext.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : toNext);
            progress.setProgressPercentage(tier.computeProgressPercentage(currentPoints));
        }

        return progress;
    }

    private CustomerStatsResponse buildStats(
            List<PurchaseTransaction> transactions,
            List<Redemption> redemptions) {

        BigDecimal lifetimeEarned = transactions.stream()
                .map(PurchaseTransaction::getPointsEarned)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal lifetimeRedeemed = redemptions.stream()
                .map(Redemption::getPointsUsed)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);

        CustomerStatsResponse stats = new CustomerStatsResponse();
        stats.setTotalTransactions(transactions.size());
        stats.setTotalRedemptions(redemptions.size());
        stats.setLifetimePointsEarned(lifetimeEarned);
        stats.setLifetimePointsRedeemed(lifetimeRedeemed);
        return stats;
    }

    private List<CustomerProfileRecentTransactionResponse> buildRecentTransactions(
            List<PurchaseTransaction> transactions) {
        return transactions.stream()
                .limit(RECENT_TRANSACTIONS_LIMIT)
                .map(this::toRecentTransactionResponse)
                .toList();
    }

    private List<CustomerProfileRecentRedemptionResponse> buildRecentRedemptions(
            List<Redemption> redemptions) {
        return redemptions.stream()
                .limit(RECENT_REDEMPTIONS_LIMIT)
                .map(this::toRecentRedemptionResponse)
                .toList();
    }

    private List<PointsHistoryEntryResponse> buildPointsHistory(List<PointsMovement> movements) {
        List<PointsHistoryEntryResponse> history = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

        for (PointsMovement movement : movements) {
            BigDecimal pts = movement.getPoints() == null
                    ? BigDecimal.ZERO
                    : movement.getPoints().setScale(4, RoundingMode.HALF_UP);

            if (movement.getType() == PointsMovementType.REDEEM
                    || movement.getType() == PointsMovementType.EXPIRE) {
                runningBalance = runningBalance.add(pts.abs().negate());
            } else {
                runningBalance = runningBalance.add(pts);
            }

            PointsHistoryEntryResponse entry = new PointsHistoryEntryResponse();
            entry.setDate(movement.getCreatedAt());
            entry.setType(movement.getType().name());
            entry.setPoints(pts);
            entry.setRunningBalance(runningBalance);
            entry.setDescription(movement.getDescription());
            entry.setProgramName(movement.getProgramConfig().getProgramName());
            entry.setCreatedBy(movement.getCreatedBy());
            history.add(entry);
        }

        return history;
    }

    // --- mappers ---

    private CustomerProfileRecentTransactionResponse toRecentTransactionResponse(PurchaseTransaction tx) {
        CustomerProfileRecentTransactionResponse response = new CustomerProfileRecentTransactionResponse();
        response.setId(tx.getId());
        response.setAmount(tx.getAmount());
        response.setPointsEarned(tx.getPointsEarned());
        response.setDescription(tx.getDescription());
        response.setTransactionDate(tx.getTransactionDate());
        response.setProgramName(tx.getProgramConfig().getProgramName());
        response.setCreatedBy(tx.getCreatedBy());
        return response;
    }

    private CustomerProfileRecentRedemptionResponse toRecentRedemptionResponse(Redemption redemption) {
        CustomerProfileRecentRedemptionResponse response = new CustomerProfileRecentRedemptionResponse();
        response.setId(redemption.getId());
        response.setRewardName(redemption.getReward().getName());
        response.setRewardImageUrl(redemption.getReward().getImageUrl());
        response.setPointsUsed(redemption.getPointsUsed());
        response.setRedemptionDate(redemption.getRedemptionDate());
        response.setStatus(redemption.getStatus().name());
        response.setCreatedBy(redemption.getCreatedBy());
        return response;
    }

    // --- helpers ---

    private Long resolveAuthenticatedTenantId(String currentUserEmail) {
        AppUser user = appUserRepository
                .findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));
        if (user.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }
        return user.getTenant().getId();
    }

    private Customer findCustomerByIdAndTenantId(Long customerId, Long tenantId) {
        return customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
    }

    private BigDecimal safePoints(BigDecimal points) {
        return points != null ? points : BigDecimal.ZERO;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
