package com.puent.sifipro.customer.service;

import java.util.List;
import com.puent.sifipro.customer.dto.CreateCustomerRequest;
import com.puent.sifipro.customer.dto.CustomerResponse;
import com.puent.sifipro.customer.dto.UpdateCustomerRequest;

public interface CustomerService {

    CustomerResponse createCustomer(CreateCustomerRequest request, String currentUserEmail);

    List<CustomerResponse> getAllCustomers(String currentUserEmail);

    CustomerResponse getCustomerById(Long id, String currentUserEmail);

    CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request, String currentUserEmail);

    CustomerResponse activateCustomer(Long id, String currentUserEmail);

    CustomerResponse deactivateCustomer(Long id, String currentUserEmail);
}
