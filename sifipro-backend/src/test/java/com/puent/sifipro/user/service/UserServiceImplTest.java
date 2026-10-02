package com.puent.sifipro.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.tenant.entity.Tenant;
import com.puent.sifipro.user.dto.CreateUserRequest;
import com.puent.sifipro.user.dto.UpdateUserRequest;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.entity.UserRole;
import com.puent.sifipro.user.repository.AppUserRepository;

/**
 * Pure unit tests (Mockito, no Spring context, no database) for the role and
 * self-protection rules of tenant user management.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    private static final Long TENANT_ID = 10L;
    private static final String ADMIN_EMAIL = "admin@tenant.test";

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserServiceImpl userService;
    private AppUser currentAdmin;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(appUserRepository, passwordEncoder);

        Tenant tenant = new Tenant();
        tenant.setId(TENANT_ID);
        tenant.setActive(Boolean.TRUE);

        currentAdmin = user(1L, ADMIN_EMAIL, UserRole.ADMIN, tenant);
    }

    @Test
    void createUser_withPlatformAdminRole_isRejectedAndNothingIsSaved() {
        CreateUserRequest request = new CreateUserRequest();
        request.setFirstName("Eve");
        request.setLastName("Escalation");
        request.setEmail("eve@tenant.test");
        request.setPassword("Password123!");
        request.setRole(UserRole.PLATFORM_ADMIN);

        assertThatThrownBy(() -> userService.createUser(request, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PLATFORM_ADMIN")
                .hasMessageContaining("Allowed roles: ADMIN, STAFF");

        verify(appUserRepository, never()).save(any());
    }

    @Test
    void updateUser_toPlatformAdminRole_isRejected() {
        AppUser staff = user(2L, "staff@tenant.test", UserRole.STAFF, currentAdmin.getTenant());
        givenCurrentAdminAndTarget(staff);

        assertThatThrownBy(() -> userService.updateUser(2L, updateRequest(staff, UserRole.PLATFORM_ADMIN), ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PLATFORM_ADMIN");

        verify(appUserRepository, never()).save(any());
    }

    @Test
    void deactivateUser_ownAccount_isRejected() {
        givenCurrentAdminAndTarget(currentAdmin);

        assertThatThrownBy(() -> userService.deactivateUser(1L, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessage("You cannot deactivate your own account.");

        assertThat(currentAdmin.getActive()).isTrue();
        verify(appUserRepository, never()).save(any());
    }

    @Test
    void updateUser_removingOwnAdminRole_isRejected() {
        givenCurrentAdminAndTarget(currentAdmin);

        assertThatThrownBy(() -> userService.updateUser(1L, updateRequest(currentAdmin, UserRole.STAFF), ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessage("You cannot remove the ADMIN role from your own account.");

        assertThat(currentAdmin.getRole()).isEqualTo(UserRole.ADMIN);
        verify(appUserRepository, never()).save(any());
    }

    @Test
    void deactivateUser_lastActiveAdmin_isRejected() {
        AppUser otherAdmin = user(3L, "other-admin@tenant.test", UserRole.ADMIN, currentAdmin.getTenant());
        givenCurrentAdminAndTarget(otherAdmin);
        when(appUserRepository.countByTenantIdAndRoleAndActiveTrue(TENANT_ID, UserRole.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> userService.deactivateUser(3L, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .hasMessage("The tenant must keep at least one active ADMIN.");

        verify(appUserRepository, never()).save(any());
    }

    @Test
    void deactivateUser_otherStaff_isAllowed() {
        AppUser staff = user(2L, "staff@tenant.test", UserRole.STAFF, currentAdmin.getTenant());
        givenCurrentAdminAndTarget(staff);
        when(appUserRepository.save(staff)).thenReturn(staff);

        userService.deactivateUser(2L, ADMIN_EMAIL);

        assertThat(staff.getActive()).isFalse();
        verify(appUserRepository).save(staff);
    }

    private void givenCurrentAdminAndTarget(AppUser target) {
        when(appUserRepository.findByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(Optional.of(currentAdmin));
        when(appUserRepository.findByIdAndTenantId(target.getId(), TENANT_ID)).thenReturn(Optional.of(target));
    }

    private static UpdateUserRequest updateRequest(AppUser user, UserRole role) {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName(user.getFirstName());
        request.setLastName(user.getLastName());
        request.setEmail(user.getEmail());
        request.setRole(role);
        return request;
    }

    private static AppUser user(Long id, String email, UserRole role, Tenant tenant) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setRole(role);
        user.setActive(Boolean.TRUE);
        user.setTenant(tenant);
        return user;
    }
}
