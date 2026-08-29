-- Prepares the shared app_users table to also hold PlatformOperator users
-- (the future platform-api service), which are not associated to any tenant.
--
-- No existing data is touched: every AppUser row created so far already has a
-- non-null tenant_id, so relaxing the NOT NULL constraint has no effect on them.

-- 1. Allow tenant_id to be NULL — only future PLATFORM_ADMIN users will use this.
ALTER TABLE app_users
    ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Extend the role CHECK constraint to accept the new PLATFORM_ADMIN role value.
ALTER TABLE app_users
    DROP CONSTRAINT app_users_role_check;

ALTER TABLE app_users
    ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('ADMIN', 'STAFF', 'PLATFORM_ADMIN'));
