-- Integrity constraints for SIFIPRO (auditoría Avance 1: B4, D2 #24-27).
--
-- Moves business invariants that until now were enforced only by the application
-- into the database, so a bug or a manual UPDATE can no longer break them.
-- Existing data was verified against every rule before writing this migration
-- (see docs/database/consultas-demo.sql, "Verificación previa").
--
-- Constraints are named explicitly (ck_/fk_/idx_) so errors are readable and the
-- names are stable across environments.

-- 1. Customer email is unique per tenant, not globally.
--    The global UNIQUE came from the Hibernate-generated baseline (V1) and contradicted
--    the application rule. Per-tenant uniqueness stays enforced by the existing
--    unique index uk_customers_tenant_email_lower (tenant_id, lower(email)).
ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS ukrfbvkrffamfql7cjmen8v976v;

-- 2. Numeric business invariants.
ALTER TABLE rewards
    ADD CONSTRAINT ck_rewards_stock_non_negative CHECK (stock >= 0);

ALTER TABLE rewards
    ADD CONSTRAINT ck_rewards_required_points_positive CHECK (required_points > 0);

ALTER TABLE customers
    ADD CONSTRAINT ck_customers_points_balance_non_negative CHECK (points_balance >= 0);

ALTER TABLE purchase_transactions
    ADD CONSTRAINT ck_purchase_transactions_amount_positive CHECK (amount > 0);

ALTER TABLE program_config
    ADD CONSTRAINT ck_program_config_points_per_dollar_positive CHECK (points_per_dollar > 0);

ALTER TABLE program_config
    ADD CONSTRAINT ck_program_config_minimum_purchase_non_negative CHECK (minimum_purchase_amount >= 0);

-- 3. Platform operators never belong to a tenant; tenant users always do.
--    Backs up the application checks added in UserServiceImpl and platform-api.
ALTER TABLE app_users
    ADD CONSTRAINT ck_app_users_role_tenant_consistency
    CHECK ((role = 'PLATFORM_ADMIN') = (tenant_id IS NULL));

-- 4. Audit column created_by must point to a real internal user (nullable: rows
--    created before the column existed have no author).
ALTER TABLE purchase_transactions
    ADD CONSTRAINT fk_purchase_transactions_created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id);

ALTER TABLE redemptions
    ADD CONSTRAINT fk_redemptions_created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id);

ALTER TABLE points_movements
    ADD CONSTRAINT fk_points_movements_created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id);

-- 5. Per-customer lookups (profile, points history, redemption balance check).
CREATE INDEX IF NOT EXISTS idx_points_movements_customer_id
    ON points_movements (customer_id);

CREATE INDEX IF NOT EXISTS idx_purchase_transactions_customer_id
    ON purchase_transactions (customer_id);
