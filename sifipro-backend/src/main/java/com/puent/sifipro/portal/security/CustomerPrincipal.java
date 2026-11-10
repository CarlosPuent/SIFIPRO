package com.puent.sifipro.portal.security;

import java.security.Principal;

/**
 * Authenticated customer of the self-service portal (RF-08). It is deliberately not a
 * UserDetails/AuthenticatedUser: staff endpoints resolve the current user by email from
 * app_users, so a customer principal can never be mistaken for a staff member.
 */
public record CustomerPrincipal(Long customerId, Long tenantId, String email) implements Principal {

    @Override
    public String getName() {
        return "customer:" + customerId;
    }
}
