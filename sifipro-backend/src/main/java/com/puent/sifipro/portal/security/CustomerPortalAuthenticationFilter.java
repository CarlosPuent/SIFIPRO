package com.puent.sifipro.portal.security;

import java.io.IOException;
import java.util.List;
import com.puent.sifipro.auth.security.JwtAuthenticationFilter;
import com.puent.sifipro.auth.security.JwtService;
import com.puent.sifipro.customer.entity.Customer;
import com.puent.sifipro.customer.repository.CustomerRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates customer-portal tokens (scope=CUSTOMER) as ROLE_CUSTOMER.
 *
 * Runs after JwtAuthenticationFilter, which ignores these tokens because their subject
 * ("customer:{id}") is never a staff email. Like the staff filter, the customer and its
 * tenant are re-checked on every request, so revoking portal access, deactivating the
 * customer or suspending the tenant cuts already-issued tokens immediately.
 */
@Component
public class CustomerPortalAuthenticationFilter extends OncePerRequestFilter {

    public static final String REASON_CUSTOMER_INACTIVE = "CUSTOMER_INACTIVE";

    private final JwtService jwtService;
    private final CustomerRepository customerRepository;

    public CustomerPortalAuthenticationFilter(JwtService jwtService, CustomerRepository customerRepository) {
        this.jwtService = jwtService;
        this.customerRepository = customerRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")
                || SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String scope;
        Long customerId;
        Long tenantId;
        try {
            scope = jwtService.extractClaim(token, claims -> claims.get(JwtService.SCOPE_CLAIM, String.class));
            customerId = jwtService.extractClaim(token, claims -> toLong(claims.get("customerId")));
            tenantId = jwtService.extractClaim(token, claims -> toLong(claims.get("tenantId")));
        } catch (JwtException | IllegalArgumentException ex) {
            // Invalid or expired signature: leave the request anonymous (401 on protected paths).
            filterChain.doFilter(request, response);
            return;
        }

        if (!JwtService.CUSTOMER_SCOPE.equals(scope) || customerId == null || tenantId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Customer customer = customerRepository.findWithTenantById(customerId).orElse(null);
        if (customer == null || !tenantId.equals(customer.getTenant().getId())) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!Boolean.TRUE.equals(customer.getTenant().getActive())) {
            request.setAttribute(JwtAuthenticationFilter.REJECTION_REASON_ATTRIBUTE,
                    JwtAuthenticationFilter.REASON_TENANT_SUSPENDED);
        } else if (!Boolean.TRUE.equals(customer.getActive()) || !customer.isPortalEnabled()) {
            request.setAttribute(JwtAuthenticationFilter.REJECTION_REASON_ATTRIBUTE, REASON_CUSTOMER_INACTIVE);
        } else {
            CustomerPrincipal principal = new CustomerPrincipal(customer.getId(), tenantId, customer.getEmail());
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }
}
