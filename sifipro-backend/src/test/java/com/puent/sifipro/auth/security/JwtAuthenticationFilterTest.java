package com.puent.sifipro.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

/**
 * Pure unit tests (Mockito, no Spring context, no database): an already-issued,
 * signature-valid token must stop authenticating once the user or tenant is inactive.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    private static final String TOKEN = "signed.jwt.token";
    private static final String EMAIL = "staff@tenant.test";

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    private JwtAuthenticationFilter filter;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        request = new MockHttpServletRequest("GET", "/api/customers");
        request.addHeader("Authorization", "Bearer " + TOKEN);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validToken_ofSuspendedTenant_isNotAuthenticated() throws Exception {
        givenPrincipal(new AuthenticatedUser(EMAIL, "hash", "STAFF", true, false));

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(request.getAttribute(JwtAuthenticationFilter.REJECTION_REASON_ATTRIBUTE))
                .isEqualTo(JwtAuthenticationFilter.REASON_TENANT_SUSPENDED);
    }

    @Test
    void validToken_ofInactiveUser_isNotAuthenticated() throws Exception {
        givenPrincipal(new AuthenticatedUser(EMAIL, "hash", "STAFF", false, true));

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(request.getAttribute(JwtAuthenticationFilter.REJECTION_REASON_ATTRIBUTE))
                .isEqualTo(JwtAuthenticationFilter.REASON_USER_INACTIVE);
    }

    @Test
    void validToken_ofActiveUserAndTenant_isAuthenticated() throws Exception {
        givenPrincipal(new AuthenticatedUser(EMAIL, "hash", "STAFF", true, true));

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo(EMAIL);
        assertThat(request.getAttribute(JwtAuthenticationFilter.REJECTION_REASON_ATTRIBUTE)).isNull();
    }

    private void givenPrincipal(AuthenticatedUser principal) {
        when(jwtService.extractUsername(TOKEN)).thenReturn(EMAIL);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(principal);
        when(jwtService.isTokenValid(TOKEN, principal)).thenReturn(true);
    }
}
