package com.puent.sifipro.customer.service;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.List;
import com.puent.sifipro.customer.CustomerTier;
import com.puent.sifipro.customer.dto.CreateCustomerRequest;
import com.puent.sifipro.customer.dto.CustomerResponse;
import com.puent.sifipro.customer.dto.CustomerTierProgressResponse;
import com.puent.sifipro.customer.dto.UpdateCustomerRequest;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final AppUserRepository appUserRepository;

    public CustomerServiceImpl(CustomerRepository customerRepository, AppUserRepository appUserRepository) {
        this.customerRepository = customerRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (customerRepository.existsByEmailIgnoreCaseAndTenantId(normalizedEmail, tenantId)) {
            throw new BusinessException("A customer with this email already exists in this tenant.");
        }

        Customer customer = new Customer();
        customer.setFirstName(request.getFirstName().trim());
        customer.setLastName(request.getLastName().trim());
        customer.setEmail(normalizedEmail);
        customer.setPhone(normalizePhone(request.getPhone()));
        customer.setPointsBalance(BigDecimal.ZERO);
        customer.setActive(Boolean.TRUE);
        customer.setTenant(currentUser.getTenant());

        Customer savedCustomer = customerRepository.save(customer);
        return toResponse(savedCustomer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers(String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        return customerRepository.findAllByTenantIdOrderByIdDesc(currentUser.getTenant().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Customer customer = findCustomerByIdAndTenantId(id, currentUser.getTenant().getId());
        return toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Long tenantId = currentUser.getTenant().getId();
        Customer customer = findCustomerByIdAndTenantId(id, tenantId);

        String normalizedEmail = normalizeEmail(request.getEmail());
        boolean emailChanged = !customer.getEmail().equalsIgnoreCase(normalizedEmail);
        if (emailChanged && customerRepository.existsByEmailIgnoreCaseAndTenantId(normalizedEmail, tenantId)) {
            throw new BusinessException("A customer with this email already exists in this tenant.");
        }

        customer.setFirstName(request.getFirstName().trim());
        customer.setLastName(request.getLastName().trim());
        customer.setEmail(normalizedEmail);
        customer.setPhone(normalizePhone(request.getPhone()));

        Customer updatedCustomer = customerRepository.save(customer);
        return toResponse(updatedCustomer);
    }

    @Override
    @Transactional
    public CustomerResponse activateCustomer(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Customer customer = findCustomerByIdAndTenantId(id, currentUser.getTenant().getId());
        customer.setActive(Boolean.TRUE);

        Customer updatedCustomer = customerRepository.save(customer);
        return toResponse(updatedCustomer);
    }

    @Override
    @Transactional
    public CustomerResponse deactivateCustomer(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        Customer customer = findCustomerByIdAndTenantId(id, currentUser.getTenant().getId());
        customer.setActive(Boolean.FALSE);

        Customer updatedCustomer = customerRepository.save(customer);
        return toResponse(updatedCustomer);
    }

    private Customer findCustomerByIdAndTenantId(Long id, Long tenantId) {
        return customerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private CustomerResponse toResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setFirstName(customer.getFirstName());
        response.setLastName(customer.getLastName());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        response.setPointsBalance(customer.getPointsBalance());
        response.setActive(customer.getActive());
        response.setCreatedAt(customer.getCreatedAt());
        response.setUpdatedAt(customer.getUpdatedAt());

        BigDecimal points = customer.getPointsBalance() != null
                ? customer.getPointsBalance()
                : BigDecimal.ZERO;
        CustomerTier tier = CustomerTier.fromPoints(points);
        response.setTier(tier.name());
        response.setTierProgress(buildTierProgress(tier, points));

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

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String trimmedPhone = phone.trim();
        return trimmedPhone.isEmpty() ? null : trimmedPhone;
    }
}
