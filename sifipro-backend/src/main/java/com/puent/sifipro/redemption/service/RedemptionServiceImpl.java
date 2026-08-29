package com.puent.sifipro.redemption.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.redemption.dto.CreateRedemptionRequest;
import com.puent.sifipro.redemption.dto.RedemptionResponse;
import com.puent.sifipro.redemption.entity.Redemption;
import com.puent.sifipro.redemption.entity.RedemptionStatus;
import com.puent.sifipro.redemption.repository.RedemptionRepository;
import com.puent.sifipro.reward.entity.Reward;
import com.puent.sifipro.reward.repository.RewardRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RedemptionServiceImpl implements RedemptionService {

    private static final String REDEMPTION_REFERENCE_TYPE = "REDEMPTION";

    private final RedemptionRepository redemptionRepository;
    private final CustomerRepository customerRepository;
    private final RewardRepository rewardRepository;
    private final PointsMovementRepository pointsMovementRepository;
    private final AppUserRepository appUserRepository;

    public RedemptionServiceImpl(
            RedemptionRepository redemptionRepository,
            CustomerRepository customerRepository,
            RewardRepository rewardRepository,
            PointsMovementRepository pointsMovementRepository,
            AppUserRepository appUserRepository) {
        this.redemptionRepository = redemptionRepository;
        this.customerRepository = customerRepository;
        this.rewardRepository = rewardRepository;
        this.pointsMovementRepository = pointsMovementRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional
    public RedemptionResponse createRedemption(CreateRedemptionRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();

        Customer customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Reward reward = rewardRepository.findByIdAndTenantId(request.getRewardId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Reward not found with id: " + request.getRewardId()));

        validateRedemptionRules(customer, reward, tenantId);

        BigDecimal pointsUsed = reward.getRequiredPoints().setScale(4, RoundingMode.HALF_UP);
        String normalizedNotes = normalizeNotes(request.getNotes());

        Redemption redemption = new Redemption();
        redemption.setCustomer(customer);
        redemption.setReward(reward);
        redemption.setTenant(currentUser.getTenant());
        redemption.setProgramConfig(reward.getProgramConfig());
        redemption.setPointsUsed(pointsUsed);
        redemption.setRedemptionDate(request.getRedemptionDate());
        redemption.setStatus(RedemptionStatus.COMPLETED);
        redemption.setNotes(normalizedNotes);
        redemption.setCreatedBy(currentUser.getId());

        Redemption savedRedemption = redemptionRepository.save(redemption);

        BigDecimal currentBalance = customer.getPointsBalance() == null ? BigDecimal.ZERO : customer.getPointsBalance();
        BigDecimal updatedBalance = currentBalance.subtract(pointsUsed).setScale(4, RoundingMode.HALF_UP);
        customer.setPointsBalance(updatedBalance);
        customerRepository.save(customer);

        reward.setStock(reward.getStock() - 1);
        rewardRepository.save(reward);

        PointsMovement movement = new PointsMovement();
        movement.setCustomer(customer);
        movement.setTenant(currentUser.getTenant());
        movement.setProgramConfig(reward.getProgramConfig());
        movement.setType(PointsMovementType.REDEEM);
        movement.setPoints(pointsUsed.negate());
        movement.setDescription(normalizedNotes);
        movement.setReferenceType(REDEMPTION_REFERENCE_TYPE);
        movement.setReferenceId(savedRedemption.getId());
        movement.setCreatedBy(currentUser.getId());
        pointsMovementRepository.save(movement);

        return toResponse(savedRedemption);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RedemptionResponse> getAllRedemptions(String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        return redemptionRepository.findAllByTenantIdOrderByIdDesc(currentUser.getTenant().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RedemptionResponse getRedemptionById(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Redemption redemption = redemptionRepository.findByIdAndTenantId(id, currentUser.getTenant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Redemption not found with id: " + id));
        return toResponse(redemption);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RedemptionResponse> getRedemptionsByCustomerId(Long customerId, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();

        customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        return redemptionRepository.findAllByCustomerIdAndTenantIdOrderByIdDesc(customerId, tenantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateRedemptionRules(Customer customer, Reward reward, Long tenantId) {
        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new BusinessException("Customer is inactive.");
        }

        if (!Boolean.TRUE.equals(reward.getActive())) {
            throw new BusinessException("Reward is inactive.");
        }

        if (reward.getStock() == null || reward.getStock() <= 0) {
            throw new BusinessException("Reward is out of stock.");
        }

        BigDecimal customerProgramBalance = calculateProgramBalance(customer.getId(), tenantId,
                reward.getProgramConfig().getId());
        BigDecimal requiredPoints = reward.getRequiredPoints().setScale(4, RoundingMode.HALF_UP);

        if (customerProgramBalance.compareTo(requiredPoints) < 0) {
            throw new BusinessException("Insufficient points for this program.");
        }
    }

    private BigDecimal calculateProgramBalance(Long customerId, Long tenantId, Long programConfigId) {
        BigDecimal balance = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

        List<PointsMovement> movements = pointsMovementRepository
                .findAllByCustomerIdAndTenantIdAndProgramConfigIdOrderByIdAsc(customerId, tenantId, programConfigId);

        for (PointsMovement movement : movements) {
            BigDecimal movementPoints = movement.getPoints() == null
                    ? BigDecimal.ZERO
                    : movement.getPoints().setScale(4, RoundingMode.HALF_UP);

            if (movement.getType() == PointsMovementType.REDEEM || movement.getType() == PointsMovementType.EXPIRE) {
                balance = balance.add(movementPoints.abs().negate());
                continue;
            }

            balance = balance.add(movementPoints);
        }

        return balance;
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private RedemptionResponse toResponse(Redemption redemption) {
        RedemptionResponse response = new RedemptionResponse();
        response.setId(redemption.getId());
        response.setCustomerId(redemption.getCustomer().getId());
        response.setCustomerFullName(buildCustomerFullName(redemption.getCustomer()));
        response.setRewardId(redemption.getReward().getId());
        response.setRewardName(redemption.getReward().getName());
        response.setProgramConfigId(redemption.getProgramConfig().getId());
        response.setProgramName(redemption.getProgramConfig().getProgramName());
        response.setPointsUsed(redemption.getPointsUsed());
        response.setRedemptionDate(redemption.getRedemptionDate());
        response.setStatus(redemption.getStatus());
        response.setNotes(redemption.getNotes());
        response.setCreatedAt(redemption.getCreatedAt());
        response.setUpdatedAt(redemption.getUpdatedAt());
        response.setCreatedBy(redemption.getCreatedBy());
        return response;
    }

    private String buildCustomerFullName(Customer customer) {
        return (customer.getFirstName() + " " + customer.getLastName()).trim();
    }

    private String normalizeNotes(String notes) {
        if (notes == null) {
            return null;
        }
        String trimmedNotes = notes.trim();
        return trimmedNotes.isEmpty() ? null : trimmedNotes;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
