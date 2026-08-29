-- Adds tenant and program scoping for purchase transactions and points movements.
-- PostgreSQL script.
-- Safe to run manually with validation checks before NOT NULL enforcement.


--MANUAL_APPLIED_DEV_ONLY
--NO EJECUTAR OTRA VEZ
--APPLIED — fully reflected in db/migration/V1__baseline_schema.sql (tenant_id/program_config_id
--NOT NULL + FKs + indexes on purchase_transactions and points_movements are already part of
--the Flyway baseline). Kept here only for historical reference; not a pending migration.


BEGIN;

ALTER TABLE purchase_transactions
    ADD COLUMN IF NOT EXISTS tenant_id BIGINT;

ALTER TABLE purchase_transactions
    ADD COLUMN IF NOT EXISTS program_config_id BIGINT;

ALTER TABLE points_movements
    ADD COLUMN IF NOT EXISTS tenant_id BIGINT;

ALTER TABLE points_movements
    ADD COLUMN IF NOT EXISTS program_config_id BIGINT;

-- Backfill tenant_id from related customer
UPDATE purchase_transactions pt
SET tenant_id = c.tenant_id
FROM customers c
WHERE pt.customer_id = c.id
  AND pt.tenant_id IS NULL;

UPDATE points_movements pm
SET tenant_id = c.tenant_id
FROM customers c
WHERE pm.customer_id = c.id
  AND pm.tenant_id IS NULL;

-- Backfill program_config_id using the first program of the tenant associated to the customer
UPDATE purchase_transactions pt
SET program_config_id = src.program_id
FROM (
    SELECT c.id AS customer_id, MIN(p.id) AS program_id
    FROM customers c
    JOIN program_config p ON p.tenant_id = c.tenant_id
    GROUP BY c.id
) src
WHERE pt.customer_id = src.customer_id
  AND pt.program_config_id IS NULL;

UPDATE points_movements pm
SET program_config_id = src.program_id
FROM (
    SELECT c.id AS customer_id, MIN(p.id) AS program_id
    FROM customers c
    JOIN program_config p ON p.tenant_id = c.tenant_id
    GROUP BY c.id
) src
WHERE pm.customer_id = src.customer_id
  AND pm.program_config_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_purchase_transactions_tenant'
    ) THEN
        ALTER TABLE purchase_transactions
            ADD CONSTRAINT fk_purchase_transactions_tenant
            FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_purchase_transactions_program_config'
    ) THEN
        ALTER TABLE purchase_transactions
            ADD CONSTRAINT fk_purchase_transactions_program_config
            FOREIGN KEY (program_config_id) REFERENCES program_config(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_points_movements_tenant'
    ) THEN
        ALTER TABLE points_movements
            ADD CONSTRAINT fk_points_movements_tenant
            FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_points_movements_program_config'
    ) THEN
        ALTER TABLE points_movements
            ADD CONSTRAINT fk_points_movements_program_config
            FOREIGN KEY (program_config_id) REFERENCES program_config(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchase_transactions_tenant_id
    ON purchase_transactions (tenant_id);

CREATE INDEX IF NOT EXISTS idx_purchase_transactions_tenant_program_id
    ON purchase_transactions (tenant_id, program_config_id);

CREATE INDEX IF NOT EXISTS idx_points_movements_tenant_id
    ON points_movements (tenant_id);

CREATE INDEX IF NOT EXISTS idx_points_movements_tenant_program_id
    ON points_movements (tenant_id, program_config_id);

-- Run these checks before enforcing NOT NULL:
-- SELECT * FROM purchase_transactions WHERE tenant_id IS NULL OR program_config_id IS NULL;
-- SELECT * FROM points_movements WHERE tenant_id IS NULL OR program_config_id IS NULL;

ALTER TABLE purchase_transactions
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE purchase_transactions
    ALTER COLUMN program_config_id SET NOT NULL;

ALTER TABLE points_movements
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE points_movements
    ALTER COLUMN program_config_id SET NOT NULL;

COMMIT;