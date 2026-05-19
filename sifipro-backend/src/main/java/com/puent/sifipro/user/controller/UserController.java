package com.puent.sifipro.user.controller;

import java.util.List;
import com.puent.sifipro.user.dto.CreateUserRequest;
import com.puent.sifipro.user.dto.UpdateUserPasswordRequest;
import com.puent.sifipro.user.dto.UpdateUserRequest;
import com.puent.sifipro.user.dto.UserResponse;
import com.puent.sifipro.user.service.UserService;
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
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Internal user management endpoints for ADMIN role.")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @Operation(summary = "Create user", description = "Creates a new internal user with ADMIN or STAFF role.")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication) {
        UserResponse response = userService.createUser(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List users", description = "Returns all internal users.")
    public ResponseEntity<List<UserResponse>> getAllUsers(Authentication authentication) {
        List<UserResponse> response = userService.getAllUsers(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by id", description = "Returns one internal user by identifier.")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id, Authentication authentication) {
        UserResponse response = userService.getUserById(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Updates user profile and role, excluding password.")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        UserResponse response = userService.updateUser(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate user", description = "Marks an internal user as active.")
    public ResponseEntity<UserResponse> activateUser(@PathVariable Long id, Authentication authentication) {
        UserResponse response = userService.activateUser(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate user", description = "Marks an internal user as inactive.")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable Long id, Authentication authentication) {
        UserResponse response = userService.deactivateUser(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/password")
    @Operation(summary = "Update user password", description = "Updates the target user password using BCrypt encoding.")
    public ResponseEntity<Void> updatePassword(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserPasswordRequest request,
            Authentication authentication) {
        userService.updatePassword(id, request, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
