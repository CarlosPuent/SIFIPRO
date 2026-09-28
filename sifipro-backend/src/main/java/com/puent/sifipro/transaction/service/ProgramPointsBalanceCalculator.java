package com.puent.sifipro.transaction.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import org.springframework.stereotype.Component;

/**
 * Points a customer holds in one program, computed from the points ledger.
 *
 * Single source of truth for the rule used by redemptions (can the customer afford a
 * reward?) and manual adjustments (would the adjustment leave the program negative?):
 * EARN and ADJUSTMENT add their signed value; REDEEM and EXPIRE subtract their
 * absolute value, whatever sign they were stored with.
 */
@Component
public class ProgramPointsBalanceCalculator {

    private final PointsMovementRepository pointsMovementRepository;

    public ProgramPointsBalanceCalculator(PointsMovementRepository pointsMovementRepository) {
        this.pointsMovementRepository = pointsMovementRepository;
    }

    public BigDecimal calculate(Long customerId, Long tenantId, Long programConfigId) {
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
}
