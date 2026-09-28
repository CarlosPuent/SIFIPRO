package com.puent.sifipro.transaction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.transaction.dto.CreatePointsAdjustmentRequest;
import com.puent.sifipro.transaction.dto.PointsAdjustmentResponse;
import com.puent.sifipro.transaction.entity.PointsMovement;
import com.puent.sifipro.transaction.entity.PointsMovementType;
import com.puent.sifipro.transaction.repository.PointsMovementRepository;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Pure unit tests (Mockito, no Spring context, no database) for manual points
 * adjustments (RF-09).
 */
@ExtendWith(MockitoExtension.class)
class PointsAdjustmentServiceImplTest {

    private static final Long TENANT_ID = 10L;
    private static final Long CUSTOMER_ID = 1L;
    private static final Long PROGRAM_ID = 5L;
    private static final String ADMIN_EMAIL = "admin@tenant.test";

    @Mock private CustomerRepository customerRepository;
    @Mock private ProgramConfigRepository programConfigRepository;
    @Mock private PointsMovementRepository pointsMovementRepository;
    @Mock private AppUserRepository appUserRepository;
    @Mock private ProgramPointsBalanceCalculator programPointsBalanceCalculator;

    private PointsAdjustmentServiceImpl service;
    private Customer customer;
    private ProgramConfig program;

    @BeforeEach
    void setUp() {
        service = new PointsAdjustmentServiceImpl(customerRepository, programConfigRepository,
                pointsMovementRepository, appUserRepository, programPointsBalanceCalculator);

        Tenant tenant = new Tenant();
        tenant.setId(TENANT_ID);

        AppUser admin = new AppUser();
        admin.setId(2L);
        admin.setEmail(ADMIN_EMAIL);
        admin.setRole(UserRole.ADMIN);
        admin.setTenant(tenant);
        when(appUserRepository.findByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(Optional.of(admin));

        customer = new Customer();
        customer.setId(CUSTOMER_ID);
        customer.setPointsBalance(new BigDecimal("300.0000"));
        customer.setTenant(tenant);

        program = new ProgramConfig();
        program.setId(PROGRAM_ID);
        program.setProgramName("SIFIPRO Rewards");
    }

    @Test
    void validAdjustment_createsAdjustmentMovementWithAuthorAndReason_andUpdatesBalance() {
        givenCustomerProgramAndProgramBalance("300.0000");
        when(pointsMovementRepository.save(any(PointsMovement.class))).thenAnswer(invocation -> {
            PointsMovement movement = invocation.getArgument(0);
            movement.setId(80L);
            return movement;
        });

        PointsAdjustmentResponse response =
                service.createAdjustment(CUSTOMER_ID, request("50", "  Compensación por compra no registrada "), ADMIN_EMAIL);

        ArgumentCaptor<PointsMovement> saved = ArgumentCaptor.forClass(PointsMovement.class);
        verify(pointsMovementRepository).save(saved.capture());
        PointsMovement movement = saved.getValue();
        assertThat(movement.getType()).isEqualTo(PointsMovementType.ADJUSTMENT);
        assertThat(movement.getPoints()).isEqualByComparingTo("50");
        assertThat(movement.getReason()).isEqualTo("Compensación por compra no registrada");
        assertThat(movement.getCreatedBy()).isEqualTo(2L);
        assertThat(movement.getReferenceId()).isNull();

        assertThat(customer.getPointsBalance()).isEqualByComparingTo("350");
        verify(customerRepository).save(customer);
        assertThat(response.pointsBalance()).isEqualByComparingTo("350");
        assertThat(response.programBalance()).isEqualByComparingTo("350");
        assertThat(response.movementId()).isEqualTo(80L);
    }

    @Test
    void adjustmentLeavingProgramBalanceNegative_isRejected() {
        givenCustomerProgramAndProgramBalance("100.0000");

        assertThatThrownBy(() -> service.createAdjustment(CUSTOMER_ID, request("-150", "Corrección de saldo"), ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("in this program negative");

        verify(pointsMovementRepository, never()).save(any());
        verify(customerRepository, never()).save(any());
        assertThat(customer.getPointsBalance()).isEqualByComparingTo("300");
    }

    @Test
    void adjustmentLeavingGlobalBalanceNegative_isRejected() {
        customer.setPointsBalance(new BigDecimal("40.0000"));
        givenCustomerProgramAndProgramBalance("100.0000");

        assertThatThrownBy(() -> service.createAdjustment(CUSTOMER_ID, request("-60", "Corrección de saldo"), ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Adjustment would leave the customer's balance negative.");

        verify(pointsMovementRepository, never()).save(any());
    }

    @Test
    void blankReason_isRejected() {
        givenCustomerAndProgram();

        assertThatThrownBy(() -> service.createAdjustment(CUSTOMER_ID, request("10", "    "), ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Reason");

        verify(pointsMovementRepository, never()).save(any());
    }

    @Test
    void zeroPoints_isRejected() {
        givenCustomerAndProgram();

        assertThatThrownBy(() -> service.createAdjustment(CUSTOMER_ID, request("0", "Corrección de saldo"), ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Points must be different from zero.");
    }

    @Test
    void customerOfAnotherTenant_isNotFound() {
        when(customerRepository.findByIdAndTenantId(CUSTOMER_ID, TENANT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createAdjustment(CUSTOMER_ID, request("10", "Corrección de saldo"), ADMIN_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(pointsMovementRepository, never()).save(any());
    }

    private void givenCustomerAndProgram() {
        when(customerRepository.findByIdAndTenantId(CUSTOMER_ID, TENANT_ID)).thenReturn(Optional.of(customer));
        when(programConfigRepository.findByIdAndTenantId(PROGRAM_ID, TENANT_ID)).thenReturn(Optional.of(program));
    }

    private void givenCustomerProgramAndProgramBalance(String programBalance) {
        givenCustomerAndProgram();
        when(programPointsBalanceCalculator.calculate(CUSTOMER_ID, TENANT_ID, PROGRAM_ID))
                .thenReturn(new BigDecimal(programBalance));
    }

    private static CreatePointsAdjustmentRequest request(String points, String reason) {
        CreatePointsAdjustmentRequest request = new CreatePointsAdjustmentRequest();
        request.setProgramConfigId(PROGRAM_ID);
        request.setPoints(new BigDecimal(points));
        request.setReason(reason);
        return request;
    }
}
