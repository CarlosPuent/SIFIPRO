package com.puent.sifipro.shared.exception;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
                List<String> details = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                                .toList();

                ApiErrorResponse response = buildErrorResponse(
                                HttpStatus.BAD_REQUEST,
                                "Validation failed",
                                details);
                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ApiErrorResponse> handleBusinessException(BusinessException ex) {
                ApiErrorResponse response = buildErrorResponse(
                                HttpStatus.BAD_REQUEST,
                                ex.getMessage(),
                                List.of());
                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
                ApiErrorResponse response = buildErrorResponse(
                                HttpStatus.NOT_FOUND,
                                ex.getMessage(),
                                List.of());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
                ApiErrorResponse response = buildErrorResponse(
                                HttpStatus.BAD_REQUEST,
                                ex.getMessage(),
                                List.of());
                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolationException(
                        DataIntegrityViolationException ex) {
                String detail = ex.getMostSpecificCause() != null && ex.getMostSpecificCause().getMessage() != null
                                ? ex.getMostSpecificCause().getMessage()
                                : "Data integrity constraint violation.";

                ApiErrorResponse response = buildErrorResponse(
                                HttpStatus.CONFLICT,
                                "Operation violates database integrity constraints.",
                                List.of(detail));
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadableException(
                        HttpMessageNotReadableException ex) {
                ApiErrorResponse response = buildErrorResponse(
                                HttpStatus.BAD_REQUEST,
                                "Malformed request body.",
                                List.of());
                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
                ApiErrorResponse response = buildErrorResponse(
                                HttpStatus.FORBIDDEN,
                                "Access denied.",
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
