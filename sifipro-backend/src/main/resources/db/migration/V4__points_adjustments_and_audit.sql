-- Manual points adjustments and the points audit log (RF-09).
--
-- An ADJUSTMENT is not tied to a purchase or a redemption, so it has no reference
-- entity; instead it must carry the reason given by the ADMIN who made it. Both rules
-- are enforced here so the audit trail stays complete even outside the application.

-- 1. Reason of a manual adjustment (other movement types keep using "description").
ALTER TABLE points_movements
    ADD COLUMN reason VARCHAR(255);

ALTER TABLE points_movements
    ADD CONSTRAINT ck_points_movements_adjustment_reason
    CHECK (type <> 'ADJUSTMENT' OR (reason IS NOT NULL AND char_length(btrim(reason)) >= 5));

-- 2. Only adjustments may lack a reference (EARN -> purchase, REDEEM -> redemption).
ALTER TABLE points_movements
    ALTER COLUMN reference_id DROP NOT NULL;

ALTER TABLE points_movements
    ADD CONSTRAINT ck_points_movements_reference_required
    CHECK (type = 'ADJUSTMENT' OR reference_id IS NOT NULL);

-- 3. Audit log listing: newest movements of a tenant first.
CREATE INDEX IF NOT EXISTS idx_points_movements_tenant_created
    ON points_movements (tenant_id, created_at DESC, id DESC);
