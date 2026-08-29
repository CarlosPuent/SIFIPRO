package com.puent.sifipro.transaction.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.loyalty.entity.ProgramConfig;
import com.puent.sifipro.loyalty.repository.ProgramConfigRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.transaction.dto.CreatePurchaseTransactionRequest;
import com.puent.sifipro.transaction.dto.PointsMovementResponse;
import com.puent.sifipro.transaction.dto.PurchaseTransactionResponse;
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
public class PurchaseTransactionServiceImpl implements PurchaseTransactionService {

    private static final String PURCHASE_REFERENCE_TYPE = "PURCHASE_TRANSACTION";

    private final PurchaseTransactionRepository purchaseTransactionRepository;
    private final PointsMovementRepository pointsMovementRepository;
    private final CustomerRepository customerRepository;
    private final ProgramConfigRepository programConfigRepository;
    private final AppUserRepository appUserRepository;

    public PurchaseTransactionServiceImpl(
            PurchaseTransactionRepository purchaseTransactionRepository,
            PointsMovementRepository pointsMovementRepository,
            CustomerRepository customerRepository,
            ProgramConfigRepository programConfigRepository,
            AppUserRepository appUserRepository) {
        this.purchaseTransactionRepository = purchaseTransactionRepository;
        this.pointsMovementRepository = pointsMovementRepository;
        this.customerRepository = customerRepository;
        this.programConfigRepository = programConfigRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional
    public PurchaseTransactionResponse createPurchaseTransaction(
            CreatePurchaseTransactionRequest request,
            String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();

        Customer customer = findCustomerByIdAndTenantId(request.getCustomerId(), tenantId);
        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new BusinessException("Customer is inactive.");
        }

        ProgramConfig programConfig = findProgramByIdAndTenantId(request.getProgramConfigId(), tenantId);
        if (!Boolean.TRUE.equals(programConfig.getActive())) {
            throw new BusinessException("Program is inactive.");
        }

        BigDecimal normalizedAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        String normalizedDescription = normalizeDescription(request.getDescription());

        BigDecimal pointsEarned = calculatePointsEarned(
                normalizedAmount,
                programConfig.getMinimumPurchaseAmount(),
                programConfig.getPointsPerDollar());

        PurchaseTransaction transaction = new PurchaseTransaction();
        transaction.setCustomer(customer);
        transaction.setTenant(currentUser.getTenant());
        transaction.setProgramConfig(programConfig);
        transaction.setAmount(normalizedAmount);
        transaction.setDescription(normalizedDescription);
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setPointsEarned(pointsEarned);
        transaction.setCreatedBy(currentUser.getId());

        PurchaseTransaction savedTransaction = purchaseTransactionRepository.save(transaction);

        if (pointsEarned.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentBalance = customer.getPointsBalance() == null ? BigDecimal.ZERO
                    : customer.getPointsBalance();
            BigDecimal updatedBalance = currentBalance.add(pointsEarned).setScale(4, RoundingMode.HALF_UP);
            customer.setPointsBalance(updatedBalance);
            customerRepository.save(customer);

            PointsMovement movement = new PointsMovement();
            movement.setCustomer(customer);
            movement.setTenant(currentUser.getTenant());
            movement.setProgramConfig(programConfig);
            movement.setType(PointsMovementType.EARN);
            movement.setPoints(pointsEarned);
            movement.setDescription(normalizedDescription);
            movement.setReferenceType(PURCHASE_REFERENCE_TYPE);
            movement.setReferenceId(savedTransaction.getId());
            movement.setCreatedBy(currentUser.getId());
            pointsMovementRepository.save(movement);
        }

        return toTransactionResponse(savedTransaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseTransactionResponse> getAllTransactions(String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        return purchaseTransactionRepository.findAllByTenantIdOrderByIdDesc(currentUser.getTenant().getId())
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseTransactionResponse> getTransactionsByProgram(Long programConfigId, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        findProgramByIdAndTenantId(programConfigId, tenantId);

        return purchaseTransactionRepository.findAllByTenantIdAndProgramConfigIdOrderByIdDesc(tenantId, programConfigId)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseTransactionResponse getTransactionById(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        PurchaseTransaction transaction = purchaseTransactionRepository
                .findByIdAndTenantId(id, currentUser.getTenant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase transaction not found with id: " + id));
        return toTransactionResponse(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseTransactionResponse> getTransactionsByCustomerId(Long customerId, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        findCustomerByIdAndTenantId(customerId, tenantId);

        return purchaseTransactionRepository.findAllByCustomerIdAndTenantIdOrderByIdDesc(customerId, tenantId)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PointsMovementResponse> getAllPointsMovements(String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        return pointsMovementRepository.findAllByTenantIdOrderByIdDesc(currentUser.getTenant().getId())
                .stream()
                .map(this::toPointsMovementResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PointsMovementResponse> getPointsMovementsByProgram(Long programConfigId, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        findProgramByIdAndTenantId(programConfigId, tenantId);

        return pointsMovementRepository.findAllByTenantIdAndProgramConfigIdOrderByIdDesc(tenantId, programConfigId)
                .stream()
                .map(this::toPointsMovementResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PointsMovementResponse> getPointsMovementsByCustomerId(Long customerId, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        findCustomerByIdAndTenantId(customerId, tenantId);

        return pointsMovementRepository.findAllByCustomerIdAndTenantIdOrderByIdDesc(customerId, tenantId)
                .stream()
                .map(this::toPointsMovementResponse)
                .toList();
    }

    private Customer findCustomerByIdAndTenantId(Long customerId, Long tenantId) {
        return customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
    }

    private ProgramConfig findProgramByIdAndTenantId(Long programConfigId, Long tenantId) {
        return programConfigRepository.findByIdAndTenantId(programConfigId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Program not found with id: " + programConfigId));
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private BigDecimal calculatePointsEarned(BigDecimal amount, BigDecimal minimumPurchaseAmount,
            BigDecimal pointsPerDollar) {
        if (amount.compareTo(minimumPurchaseAmount) < 0) {
            return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        }
        return amount.multiply(pointsPerDollar).setScale(4, RoundingMode.HALF_UP);
    }

    private PurchaseTransactionResponse toTransactionResponse(PurchaseTransaction transaction) {
        PurchaseTransactionResponse response = new PurchaseTransactionResponse();
        response.setId(transaction.getId());
        response.setCustomerId(transaction.getCustomer().getId());
        response.setProgramConfigId(transaction.getProgramConfig().getId());
        response.setProgramName(transaction.getProgramConfig().getProgramName());
        response.setCustomerFullName(buildCustomerFullName(transaction.getCustomer()));
        response.setAmount(transaction.getAmount());
        response.setDescription(transaction.getDescription());
        response.setTransactionDate(transaction.getTransactionDate());
        response.setPointsEarned(transaction.getPointsEarned());
        response.setAwardedPoints(transaction.getPointsEarned());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setUpdatedAt(transaction.getUpdatedAt());
        response.setCreatedBy(transaction.getCreatedBy());
        return response;
    }

    private PointsMovementResponse toPointsMovementResponse(PointsMovement movement) {
        PointsMovementResponse response = new PointsMovementResponse();
        response.setId(movement.getId());
        response.setCustomerId(movement.getCustomer().getId());
        response.setProgramConfigId(movement.getProgramConfig().getId());
        response.setProgramName(movement.getProgramConfig().getProgramName());
        response.setType(movement.getType());
        response.setPoints(movement.getPoints());
        response.setDescription(movement.getDescription());
        response.setReferenceType(movement.getReferenceType());
        response.setReferenceId(movement.getReferenceId());
        response.setMovementDate(movement.getCreatedAt());
        response.setCreatedAt(movement.getCreatedAt());
        response.setUpdatedAt(movement.getUpdatedAt());
        response.setCreatedBy(movement.getCreatedBy());
        return response;
    }

    private String buildCustomerFullName(Customer customer) {
        return (customer.getFirstName() + " " + customer.getLastName()).trim();
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmedDescription = description.trim();
        return trimmedDescription.isEmpty() ? null : trimmedDescription;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
