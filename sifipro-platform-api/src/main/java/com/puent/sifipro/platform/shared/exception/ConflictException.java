package com.puent.sifipro.platform.shared.exception;

/**
 * A resource already exists / would collide with an existing one (duplicate tenant
 * code, duplicate email). Mapped to 409 Conflict — deliberately distinct from the
 * generic DB constraint-violation message so callers get an explicit, actionable
 * error instead of raw SQL detail.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
