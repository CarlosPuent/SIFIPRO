package com.puent.sifipro.auth.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import com.puent.sifipro.shared.exception.ApiErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        // details[0] carries a machine-readable reason the frontend uses to explain the logout.
        Object rejectionReason = request.getAttribute(JwtAuthenticationFilter.REJECTION_REASON_ATTRIBUTE);
        String message;
        List<String> details;
        if (JwtAuthenticationFilter.REASON_TENANT_SUSPENDED.equals(rejectionReason)) {
            message = "Tenant account is suspended.";
            details = List.of(JwtAuthenticationFilter.REASON_TENANT_SUSPENDED);
        } else if (JwtAuthenticationFilter.REASON_USER_INACTIVE.equals(rejectionReason)) {
            message = "User account is inactive.";
            details = List.of(JwtAuthenticationFilter.REASON_USER_INACTIVE);
        } else {
            message = "Authentication is required to access this resource.";
            details = List.of("Provide a valid Bearer token.");
        }

        ApiErrorResponse errorResponse = new ApiErrorResponse(
                LocalDateTime.now(),
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                message,
                details);

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
