package com.puent.sifipro.platform.shared.exception;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .toList();

        ApiErrorResponse response = buildErrorResponse(HttpStatus.BAD_REQUEST, "Validation failed", details);
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(BusinessException ex) {
        ApiErrorResponse response = buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), List.of());
        return ResponseEntity.badRequest().body(response);
    }

    // Thrown by authenticationManager.authenticate() in AuthServiceImpl.login() — e.g.
    // wrong password, disabled account, or a role other than PLATFORM_ADMIN (which
    // CustomUserDetailsService treats as "user not found"). Exceptions thrown from a
    // controller/service reached via normal DispatcherServlet dispatch are resolved
    // here by @RestControllerAdvice BEFORE they can reach the security filter chain's
    // ExceptionTranslationFilter/RestAuthenticationEntryPoint, so this handler is what
    // actually produces the 401 for a rejected login — not the filter chain.
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        ApiErrorResponse response = buildErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password, or insufficient privileges.",
                List.of());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex) {
        ApiErrorResponse response = buildErrorResponse(HttpStatus.BAD_REQUEST, "Malformed request body.", List.of());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        ApiErrorResponse response = buildErrorResponse(
                HttpStatus.FORBIDDEN,
                "You do not have permission to access this resource.",
                List.of());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        String detail = ex.getMessage() == null || ex.getMessage().isBlank()
                ? ex.getClass().getSimpleName()
                : ex.getMessage();

        ApiErrorResponse response = buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                List.of(detail));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private ApiErrorResponse buildErrorResponse(HttpStatus status, String message, List<String> details) {
        return new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                Objects.requireNonNullElse(details, List.of()));
    }
}
