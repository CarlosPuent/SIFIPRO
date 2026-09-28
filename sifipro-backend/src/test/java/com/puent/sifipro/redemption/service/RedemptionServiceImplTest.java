package com.puent.sifipro.redemption.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.redemption.dto.ProgramPointsBalanceResponse;
import com.puent.sifipro.redemption.repository.RedemptionRepository;
import com.puent.sifipro.reward.repository.RewardRepository;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Pure unit tests (Mockito, no Spring context, no database) for the per-program
 * redeemable balance shown in the redemption form.
 */
@ExtendWith(MockitoExtension.class)
class RedemptionServiceImplTest {

    private static final Long TENANT_ID = 10L;
    private static final Long CUSTOMER_ID = 1L;
    private static final Long PROGRAM_ID = 5L;
    private static final String EMAIL = "staff@tenant.test";

    @Mock private RedemptionRepository redemptionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private RewardRepository rewardRepository;
    @Mock private PointsMovementRepository pointsMovementRepository;
    @Mock private AppUserRepository appUserRepository;
    @Mock private ProgramConfigRepository programConfigRepository;

    private RedemptionServiceImpl redemptionService;

    @BeforeEach
    void setUp() {
        redemptionService = new RedemptionServiceImpl(
                redemptionRepository, customerRepository, rewardRepository,
                pointsMovementRepository, appUserRepository, programConfigRepository);

        Tenant tenant = new Tenant();
        tenant.setId(TENANT_ID);
        AppUser staff = new AppUser();
        staff.setEmail(EMAIL);
        staff.setRole(UserRole.STAFF);
        staff.setTenant(tenant);
        when(appUserRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(staff));
        when(customerRepository.findByIdAndTenantId(CUSTOMER_ID, TENANT_ID)).thenReturn(Optional.of(new Customer()));
    }

    @Test
    void programBalance_sumsEarnedAndSubtractsRedeemedInThatProgram() {
        ProgramConfig program = new ProgramConfig();
        program.setId(PROGRAM_ID);
        program.setProgramName("SIFIPRO Rewards");
        when(programConfigRepository.findByIdAndTenantId(PROGRAM_ID, TENANT_ID)).thenReturn(Optional.of(program));
        when(pointsMovementRepository.findAllByCustomerIdAndTenantIdAndProgramConfigIdOrderByIdAsc(
                CUSTOMER_ID, TENANT_ID, PROGRAM_ID))
                .thenReturn(List.of(
                        movement(PointsMovementType.EARN, "300.0000"),
                        movement(PointsMovementType.EARN, "120.0000"),
                        // REDEEM is stored negative; the rule subtracts its absolute value.
                        movement(PointsMovementType.REDEEM, "-120.0000")));

        ProgramPointsBalanceResponse response =
                redemptionService.getProgramPointsBalance(CUSTOMER_ID, PROGRAM_ID, EMAIL);

        assertThat(response.availablePoints()).isEqualByComparingTo("300");
        assertThat(response.programName()).isEqualTo("SIFIPRO Rewards");
    }

    @Test
    void programBalance_forProgramOfAnotherTenant_isNotFound() {
        when(programConfigRepository.findByIdAndTenantId(PROGRAM_ID, TENANT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> redemptionService.getProgramPointsBalance(CUSTOMER_ID, PROGRAM_ID, EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private static PointsMovement movement(PointsMovementType type, String points) {
        PointsMovement movement = new PointsMovement();
        movement.setType(type);
        movement.setPoints(new BigDecimal(points));
        return movement;
    }
}
