package com.puent.sifipro.platform.user.entity;

/**
 * Mirrors com.puent.sifipro.user.entity.UserRole from sifipro-backend. Must contain
 * every value the shared app_users_role_check constraint allows — not just
 * PLATFORM_ADMIN — because this service reads rows created by tenant-api too
 * (e.g. to explicitly reject ADMIN/STAFF logins). An unmapped enum value would
 * throw when Hibernate deserializes an existing row.
 */
public enum UserRole {
    ADMIN,
    STAFF,
    PLATFORM_ADMIN
}
