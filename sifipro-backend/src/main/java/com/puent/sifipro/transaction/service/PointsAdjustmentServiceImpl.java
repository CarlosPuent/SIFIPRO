package com.puent.sifipro.transaction.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.transaction.dto.CreatePointsAdjustmentRequest;
import com.puent.sifipro.transaction.dto.PointsAdjustmentResponse;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manual points adjustments (RF-09). An adjustment is an ADJUSTMENT movement in the
 * points ledger, signed, with the ADMIN who made it and a mandatory reason, applied in
 * the same transaction as the customer's balance so ledger and balance stay equal.
 */
@Service
public class PointsAdjustmentServiceImpl implements PointsAdjustmentService {

    private static final String ADJUSTMENT_REFERENCE_TYPE = "MANUAL_ADJUSTMENT";
    private static final int MIN_REASON_LENGTH = 5;

    private final CustomerRepository customerRepository;
    private final ProgramConfigRepository programConfigRepository;
    private final PointsMovementRepository pointsMovementRepository;
    private final AppUserRepository appUserRepository;
    private final ProgramPointsBalanceCalculator programPointsBalanceCalculator;

    public PointsAdjustmentServiceImpl(
            CustomerRepository customerRepository,
            ProgramConfigRepository programConfigRepository,
            PointsMovementRepository pointsMovementRepository,
            AppUserRepository appUserRepository,
            ProgramPointsBalanceCalculator programPointsBalanceCalculator) {
        this.customerRepository = customerRepository;
        this.programConfigRepository = programConfigRepository;
        this.pointsMovementRepository = pointsMovementRepository;
        this.appUserRepository = appUserRepository;
        this.programPointsBalanceCalculator = programPointsBalanceCalculator;
    }

    @Override
    @Transactional
    public PointsAdjustmentResponse createAdjustment(
            Long customerId,
            CreatePointsAdjustmentRequest request,
            String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();

        // Customer and program of another tenant are reported as not found.
        Customer customer = customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        ProgramConfig program = programConfigRepository.findByIdAndTenantId(request.getProgramConfigId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Program not found with id: " + request.getProgramConfigId()));

        BigDecimal points = request.getPoints() == null
                ? BigDecimal.ZERO
                : request.getPoints().setScale(4, RoundingMode.HALF_UP);
        if (points.signum() == 0) {
            throw new BusinessException("Points must be different from zero.");
        }

        String reason = request.getReason() == null ? "" : request.getReason().trim();
        if (reason.length() < MIN_REASON_LENGTH) {
            throw new BusinessException("Reason must be at least " + MIN_REASON_LENGTH + " characters long.");
        }

        // Neither the global balance nor the balance in this program may go below zero.
        BigDecimal currentGlobal = customer.getPointsBalance() == null ? BigDecimal.ZERO : customer.getPointsBalance();
        BigDecimal newGlobal = currentGlobal.add(points).setScale(4, RoundingMode.HALF_UP);
        BigDecimal newProgramBalance = programPointsBalanceCalculator
                .calculate(customer.getId(), tenantId, program.getId())
                .add(points)
                .setScale(4, RoundingMode.HALF_UP);
        if (newProgramBalance.signum() < 0) {
            throw new BusinessException("Adjustment would leave the customer's balance in this program negative.");
        }
        if (newGlobal.signum() < 0) {
            throw new BusinessException("Adjustment would leave the customer's balance negative.");
        }

        // Saving the managed customer bumps @Version: a concurrent redemption or
        // purchase on the same customer fails with 409 instead of losing an update.
        customer.setPointsBalance(newGlobal);
        customerRepository.save(customer);

        PointsMovement movement = new PointsMovement();
        movement.setCustomer(customer);
        movement.setTenant(currentUser.getTenant());
        movement.setProgramConfig(program);
        movement.setType(PointsMovementType.ADJUSTMENT);
        movement.setPoints(points);
        movement.setReason(reason);
        movement.setDescription("Manual adjustment");
        movement.setReferenceType(ADJUSTMENT_REFERENCE_TYPE);
        movement.setReferenceId(null);
        movement.setCreatedBy(currentUser.getId());
        PointsMovement saved = pointsMovementRepository.save(movement);

        return new PointsAdjustmentResponse(
                saved.getId(),
                customer.getId(),
                program.getId(),
                program.getProgramName(),
                points,
                reason,
                newGlobal,
                newProgramBalance,
                currentUser.getId(),
                saved.getCreatedAt());
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
