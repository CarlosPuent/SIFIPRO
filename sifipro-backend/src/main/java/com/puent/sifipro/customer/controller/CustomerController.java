package com.puent.sifipro.customer.controller;

import java.util.List;
import com.puent.sifipro.customer.dto.CreateCustomerRequest;
import com.puent.sifipro.customer.dto.CustomerProfileResponse;
import com.puent.sifipro.customer.dto.CustomerResponse;
import com.puent.sifipro.customer.dto.PointsHistoryEntryResponse;
import com.puent.sifipro.customer.dto.UpdateCustomerRequest;
import com.puent.sifipro.customer.service.CustomerProfileService;
import com.puent.sifipro.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customers", description = "Customer enrollment and lifecycle endpoints.")
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerService customerService;
    private final CustomerProfileService customerProfileService;

    public CustomerController(CustomerService customerService, CustomerProfileService customerProfileService) {
        this.customerService = customerService;
        this.customerProfileService = customerProfileService;
    }

    @PostMapping
    @Operation(summary = "Create customer", description = "Creates a new customer enrolled in the loyalty system.")
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request,
            Authentication authentication) {
        CustomerResponse response = customerService.createCustomer(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List customers", description = "Returns all customers.")
    public ResponseEntity<List<CustomerResponse>> getAllCustomers(Authentication authentication) {
        List<CustomerResponse> response = customerService.getAllCustomers(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by id", description = "Returns a single customer by identifier.")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable Long id, Authentication authentication) {
        CustomerResponse response = customerService.getCustomerById(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer", description = "Updates editable customer fields.")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest request,
            Authentication authentication) {
        CustomerResponse response = customerService.updateCustomer(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate customer", description = "Marks a customer as active.")
    public ResponseEntity<CustomerResponse> activateCustomer(@PathVariable Long id, Authentication authentication) {
        CustomerResponse response = customerService.activateCustomer(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate customer", description = "Marks a customer as inactive.")
    public ResponseEntity<CustomerResponse> deactivateCustomer(
            @PathVariable Long id,
            Authentication authentication) {
        CustomerResponse response = customerService.deactivateCustomer(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/profile")
    @Operation(
            summary = "Get customer profile",
            description = "Returns the full customer profile: basic info, tier, tier progress, lifetime stats, recent transactions, and recent redemptions. Designed for the Customer Profile screen.")
    public ResponseEntity<CustomerProfileResponse> getCustomerProfile(
            @PathVariable Long id,
            Authentication authentication) {
        CustomerProfileResponse response = customerProfileService.getCustomerProfile(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/points-history")
    @Operation(
            summary = "Get customer points history",
            description = "Returns all points movements in chronological order with a cumulative running balance per entry. Use runningBalance as the Y-axis for an area chart.")
    public ResponseEntity<List<PointsHistoryEntryResponse>> getCustomerPointsHistory(
            @PathVariable Long id,
            Authentication authentication) {
        List<PointsHistoryEntryResponse> response = customerProfileService.getPointsHistory(id, authentication.getName());
        return ResponseEntity.ok(response);
    }
}
