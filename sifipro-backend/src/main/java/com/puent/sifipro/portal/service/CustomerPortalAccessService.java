package com.puent.sifipro.portal.service;

import java.util.Locale;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lets a tenant ADMIN grant or revoke a customer's access to the self-service portal.
 * The customer is always looked up inside the ADMIN's own tenant (404 otherwise).
 */
@Service
public class CustomerPortalAccessService {

    private final AppUserRepository appUserRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerPortalAccessService(
            AppUserRepository appUserRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void grantAccess(Long customerId, String password, String currentUserEmail) {
        Customer customer = findCustomer(customerId, currentUserEmail);
        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new BusinessException("Inactive customers cannot be given portal access.");
        }
        customer.setPortalPasswordHash(passwordEncoder.encode(password));
        customerRepository.save(customer);
    }

    @Transactional
    public void revokeAccess(Long customerId, String currentUserEmail) {
        Customer customer = findCustomer(customerId, currentUserEmail);
        customer.setPortalPasswordHash(null);
        customerRepository.save(customer);
    }

    private Customer findCustomer(Long customerId, String currentUserEmail) {
        String email = currentUserEmail == null ? null : currentUserEmail.trim().toLowerCase(Locale.ROOT);
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(email)
                .filter(user -> user.getTenant() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));
        return customerRepository.findByIdAndTenantId(customerId, currentUser.getTenant().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
    }
}
