-- Avance final: completes RF-01 (tenant contact data + subdomain) and RF-08 (customer role).
--
-- Every change is additive and nullable, so existing databases (and the rows they
-- already hold) migrate without manual steps.

-- 1. RF-01 · Contact data of the merchant (tenant), captured by the platform team.
ALTER TABLE tenants
    ADD COLUMN contact_email VARCHAR(150),
    ADD COLUMN contact_phone VARCHAR(30),
    ADD COLUMN address       VARCHAR(255);

-- 2. RF-01 · The tenant code doubles as its subdomain (<code>.sifipro…), so it must be a
--    valid DNS label: lowercase letters, digits and inner hyphens, 1-63 characters.
--    NOT VALID: enforced for new and updated rows without rejecting legacy codes.
ALTER TABLE tenants
    ADD CONSTRAINT ck_tenants_code_subdomain
    CHECK (code ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$') NOT VALID;

-- 3. RF-08 · Customer role: a customer can sign in to the self-service portal once an
--    ADMIN of the tenant grants access (sets a portal password). NULL = no access.
ALTER TABLE customers
    ADD COLUMN portal_password_hash VARCHAR(255),
    ADD COLUMN portal_last_login_at TIMESTAMP;
