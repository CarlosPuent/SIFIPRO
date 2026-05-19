package com.puent.sifipro.user.service;

import java.util.List;
import com.puent.sifipro.user.dto.CreateUserRequest;
import com.puent.sifipro.user.dto.UpdateUserPasswordRequest;
import com.puent.sifipro.user.dto.UpdateUserRequest;
import com.puent.sifipro.user.dto.UserResponse;

public interface UserService {

    UserResponse createUser(CreateUserRequest request, String currentUserEmail);

    List<UserResponse> getAllUsers(String currentUserEmail);

    UserResponse getUserById(Long id, String currentUserEmail);

    UserResponse updateUser(Long id, UpdateUserRequest request, String currentUserEmail);

    UserResponse activateUser(Long id, String currentUserEmail);

    UserResponse deactivateUser(Long id, String currentUserEmail);

    void updatePassword(Long id, UpdateUserPasswordRequest request, String currentUserEmail);
}
