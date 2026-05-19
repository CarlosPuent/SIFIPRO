package com.puent.sifipro.user.service;

import java.util.List;
import java.util.Locale;
import com.puent.sifipro.shared.exception.BusinessException;
import com.puent.sifipro.shared.exception.ResourceNotFoundException;
import com.puent.sifipro.user.dto.CreateUserRequest;
import com.puent.sifipro.user.dto.UpdateUserPasswordRequest;
import com.puent.sifipro.user.dto.UpdateUserRequest;
import com.puent.sifipro.user.dto.UserResponse;
import com.puent.sifipro.user.entity.AppUser;
import com.puent.sifipro.user.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request, String currentUserEmail) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BusinessException("A user with this email already exists.");
        }

        AppUser currentUser = findAuthenticatedUser(currentUserEmail);

        AppUser user = new AppUser();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(Boolean.TRUE);
        user.setTenant(currentUser.getTenant());

        AppUser savedUser = appUserRepository.save(user);
        return toResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        return appUserRepository.findAllByTenantIdOrderByIdAsc(currentUser.getTenant().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        AppUser user = findUserByIdAndTenantId(id, currentUser.getTenant().getId());
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        AppUser user = findUserByIdAndTenantId(id, currentUser.getTenant().getId());

        String normalizedEmail = normalizeEmail(request.getEmail());
        boolean emailChanged = !user.getEmail().equalsIgnoreCase(normalizedEmail);
        if (emailChanged && appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BusinessException("A user with this email already exists.");
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(normalizedEmail);
        user.setRole(request.getRole());

        AppUser updatedUser = appUserRepository.save(user);
        return toResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse activateUser(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        AppUser user = findUserByIdAndTenantId(id, currentUser.getTenant().getId());
        user.setActive(Boolean.TRUE);
        AppUser updatedUser = appUserRepository.save(user);
        return toResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse deactivateUser(Long id, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        AppUser user = findUserByIdAndTenantId(id, currentUser.getTenant().getId());
        user.setActive(Boolean.FALSE);
        AppUser updatedUser = appUserRepository.save(user);
        return toResponse(updatedUser);
    }

    @Override
    @Transactional
    public void updatePassword(Long id, UpdateUserPasswordRequest request, String currentUserEmail) {
        AppUser currentUser = findAuthenticatedUser(currentUserEmail);
        AppUser user = findUserByIdAndTenantId(id, currentUser.getTenant().getId());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        appUserRepository.save(user);
    }

    private AppUser findAuthenticatedUser(String currentUserEmail) {
        AppUser currentUser = appUserRepository.findByEmailIgnoreCase(normalizeEmail(currentUserEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (currentUser.getTenant() == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }

        return currentUser;
    }

    private AppUser findUserByIdAndTenantId(Long id, Long tenantId) {
        return appUserRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private UserResponse toResponse(AppUser user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setActive(user.getActive());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
