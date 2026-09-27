-- ============================================================================
-- SIFIPRO — Consultas de demostración (PostgreSQL 16, base sifipro_db)
--
-- Uso (desde la raíz del repo, con los contenedores arriba):
--   docker exec -it sifipro-db sh -c 'psql -U "$POSTGRES_USER" -d sifipro_db'
--   y pegar la consulta deseada. Todas son de solo lectura (SELECT).
--
-- Datos esperados tras un sembrado limpio (docker compose down -v && up):
--   tenant "demo" (admin@sifipro.com / staff@sifipro.com) y
--   tenant "cafe-norte" (admin@cafenorte.com), ambos con contraseña de demo.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Verificación previa a V3: cada fila debe dar 0 violaciones.
--    Se ejecutó antes de crear V3__integrity_constraints.sql; hoy la propia BD
--    impide que estas violaciones existan.
-- ----------------------------------------------------------------------------
SELECT 'customers: email repetido dentro de un tenant' AS chequeo, count(*) AS violaciones
FROM (SELECT tenant_id, lower(email) FROM customers GROUP BY 1, 2 HAVING count(*) > 1) x
UNION ALL SELECT 'rewards.stock < 0',                         count(*) FROM rewards WHERE stock < 0
UNION ALL SELECT 'rewards.required_points <= 0',              count(*) FROM rewards WHERE required_points <= 0
UNION ALL SELECT 'customers.points_balance < 0',              count(*) FROM customers WHERE points_balance < 0
UNION ALL SELECT 'purchase_transactions.amount <= 0',         count(*) FROM purchase_transactions WHERE amount <= 0
UNION ALL SELECT 'program_config.points_per_dollar <= 0',     count(*) FROM program_config WHERE points_per_dollar <= 0
UNION ALL SELECT 'program_config.minimum_purchase_amount < 0',count(*) FROM program_config WHERE minimum_purchase_amount < 0
UNION ALL SELECT 'app_users: rol/tenant incoherente',         count(*) FROM app_users WHERE (role = 'PLATFORM_ADMIN') <> (tenant_id IS NULL)
UNION ALL SELECT 'purchase_transactions.created_by huérfano', count(*) FROM purchase_transactions t
          WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_users u WHERE u.id = t.created_by)
UNION ALL SELECT 'redemptions.created_by huérfano',           count(*) FROM redemptions t
          WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_users u WHERE u.id = t.created_by)
UNION ALL SELECT 'points_movements.created_by huérfano',      count(*) FROM points_movements t
          WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM app_users u WHERE u.id = t.created_by);


-- ----------------------------------------------------------------------------
-- 1. Resumen por tenant: volumen de datos de cada comercio.
-- ----------------------------------------------------------------------------
SELECT t.code AS tenant,
       t.active,
       (SELECT count(*) FROM app_users u             WHERE u.tenant_id = t.id) AS usuarios,
       (SELECT count(*) FROM program_config p        WHERE p.tenant_id = t.id) AS programas,
       (SELECT count(*) FROM customers c             WHERE c.tenant_id = t.id) AS clientes,
       (SELECT count(*) FROM rewards r               WHERE r.tenant_id = t.id) AS recompensas,
       (SELECT count(*) FROM purchase_transactions x WHERE x.tenant_id = t.id) AS compras,
       (SELECT count(*) FROM redemptions d           WHERE d.tenant_id = t.id) AS canjes,
       (SELECT count(*) FROM points_movements m      WHERE m.tenant_id = t.id) AS movimientos
FROM tenants t
ORDER BY t.id;


-- ----------------------------------------------------------------------------
-- 2. Saldo vs ledger por cliente: points_balance debe ser igual a la suma del
--    ledger (EARN/ADJUSTMENT suman; REDEEM/EXPIRE restan su valor absoluto).
--    La columna "diferencia" debe ser 0.0000 en todas las filas.
-- ----------------------------------------------------------------------------
SELECT t.code AS tenant,
       c.id,
       c.first_name || ' ' || c.last_name AS cliente,
       c.points_balance,
       COALESCE(SUM(CASE WHEN m.type IN ('REDEEM', 'EXPIRE') THEN -abs(m.points) ELSE m.points END), 0) AS saldo_ledger,
       c.points_balance
         - COALESCE(SUM(CASE WHEN m.type IN ('REDEEM', 'EXPIRE') THEN -abs(m.points) ELSE m.points END), 0) AS diferencia
FROM customers c
JOIN tenants t ON t.id = c.tenant_id
LEFT JOIN points_movements m ON m.customer_id = c.id
GROUP BY t.code, c.id
ORDER BY t.code, c.id;

-- 2b. Versión resumida: número de clientes con diferencia distinta de 0 (esperado: 0).
SELECT count(*) AS clientes_descuadrados
FROM (
    SELECT c.id
    FROM customers c
    LEFT JOIN points_movements m ON m.customer_id = c.id
    GROUP BY c.id, c.points_balance
    HAVING c.points_balance
           <> COALESCE(SUM(CASE WHEN m.type IN ('REDEEM', 'EXPIRE') THEN -abs(m.points) ELSE m.points END), 0)
) descuadre;


-- ----------------------------------------------------------------------------
-- 3. Distribución de clientes por tier (misma regla que CustomerTier.java:
--    BRONZE < 500 <= SILVER < 2000 <= GOLD, sobre el saldo actual).
-- ----------------------------------------------------------------------------
SELECT t.code AS tenant,
       CASE WHEN c.points_balance >= 2000 THEN 'GOLD'
            WHEN c.points_balance >= 500  THEN 'SILVER'
            ELSE 'BRONZE' END AS tier,
       count(*) AS clientes,
       round(avg(c.points_balance), 2) AS saldo_promedio
FROM customers c
JOIN tenants t ON t.id = c.tenant_id
GROUP BY 1, 2
ORDER BY 1, min(c.points_balance) DESC;


-- ----------------------------------------------------------------------------
-- 4. Compras por mes y programa (tenant demo): monto vendido y puntos emitidos.
-- ----------------------------------------------------------------------------
SELECT to_char(date_trunc('month', pt.transaction_date), 'YYYY-MM') AS mes,
       p.program_name AS programa,
       count(*) AS compras,
       sum(pt.amount) AS monto_total,
       sum(pt.points_earned) AS puntos_emitidos,
       count(*) FILTER (WHERE pt.points_earned = 0) AS compras_bajo_minimo
FROM purchase_transactions pt
JOIN program_config p ON p.id = pt.program_config_id
JOIN tenants t ON t.id = pt.tenant_id
WHERE t.code = 'demo'
GROUP BY 1, 2
ORDER BY 1, 2;


-- ----------------------------------------------------------------------------
-- 5. Top 5 clientes por puntos ganados (tenant demo), con canjes y saldo.
-- ----------------------------------------------------------------------------
SELECT c.first_name || ' ' || c.last_name AS cliente,
       (SELECT count(*)           FROM purchase_transactions WHERE customer_id = c.id) AS compras,
       (SELECT sum(points_earned) FROM purchase_transactions WHERE customer_id = c.id) AS puntos_ganados,
       (SELECT count(*)           FROM redemptions           WHERE customer_id = c.id) AS canjes,
       c.points_balance AS saldo_actual
FROM customers c
JOIN tenants t ON t.id = c.tenant_id
WHERE t.code = 'demo'
ORDER BY puntos_ganados DESC NULLS LAST
LIMIT 5;


-- ----------------------------------------------------------------------------
-- 6. Canjes por recompensa (todas las del tenant demo), con stock restante.
--    "Audífonos inalámbricos" debe quedar agotada (stock 0).
-- ----------------------------------------------------------------------------
SELECT p.program_name AS programa,
       r.name AS recompensa,
       r.required_points AS puntos_requeridos,
       count(d.id) AS canjes,
       coalesce(sum(d.points_used), 0) AS puntos_canjeados,
       r.stock AS stock_restante,
       CASE WHEN r.stock = 0 THEN 'AGOTADA'
            WHEN r.stock <= 5 THEN 'STOCK BAJO'
            ELSE 'OK' END AS estado_stock
FROM rewards r
JOIN program_config p ON p.id = r.program_config_id
JOIN tenants t ON t.id = r.tenant_id
LEFT JOIN redemptions d ON d.reward_id = r.id
WHERE t.code = 'demo'
GROUP BY p.program_name, r.id
ORDER BY canjes DESC, r.name;


-- ----------------------------------------------------------------------------
-- 7. Aislamiento por tenant (a): el mismo email de cliente existe en dos tenants
--    como registros independientes, con saldos distintos (permitido desde V3).
-- ----------------------------------------------------------------------------
SELECT lower(c.email) AS email,
       t.code AS tenant,
       c.id AS customer_id,
       c.points_balance
FROM customers c
JOIN tenants t ON t.id = c.tenant_id
WHERE lower(c.email) IN (
    SELECT lower(email) FROM customers GROUP BY lower(email) HAVING count(DISTINCT tenant_id) > 1)
ORDER BY 1, 2;


-- ----------------------------------------------------------------------------
-- 8. Aislamiento por tenant (b): ninguna fila mezcla tenants. Cada conteo debe
--    ser 0 (p. ej. una compra cuyo cliente o programa pertenece a otro tenant).
-- ----------------------------------------------------------------------------
SELECT 'compra con cliente de otro tenant' AS chequeo, count(*) AS filas
FROM purchase_transactions pt JOIN customers c ON c.id = pt.customer_id WHERE c.tenant_id <> pt.tenant_id
UNION ALL
SELECT 'compra con programa de otro tenant', count(*)
FROM purchase_transactions pt JOIN program_config p ON p.id = pt.program_config_id WHERE p.tenant_id <> pt.tenant_id
UNION ALL
SELECT 'canje con recompensa de otro tenant', count(*)
FROM redemptions d JOIN rewards r ON r.id = d.reward_id WHERE r.tenant_id <> d.tenant_id
UNION ALL
SELECT 'canje con cliente de otro tenant', count(*)
FROM redemptions d JOIN customers c ON c.id = d.customer_id WHERE c.tenant_id <> d.tenant_id
UNION ALL
SELECT 'movimiento con cliente de otro tenant', count(*)
FROM points_movements m JOIN customers c ON c.id = m.customer_id WHERE c.tenant_id <> m.tenant_id
UNION ALL
SELECT 'operación registrada por usuario de otro tenant', count(*)
FROM purchase_transactions pt JOIN app_users u ON u.id = pt.created_by WHERE u.tenant_id IS DISTINCT FROM pt.tenant_id;


-- ----------------------------------------------------------------------------
-- 9. Actividad por usuario interno (auditoría created_by).
-- ----------------------------------------------------------------------------
SELECT t.code AS tenant,
       u.email,
       u.role,
       (SELECT count(*) FROM purchase_transactions WHERE created_by = u.id) AS compras_registradas,
       (SELECT count(*) FROM redemptions           WHERE created_by = u.id) AS canjes_registrados
FROM app_users u
LEFT JOIN tenants t ON t.id = u.tenant_id
ORDER BY t.code NULLS FIRST, u.id;


-- ----------------------------------------------------------------------------
-- 10. Constraints e índices del esquema (PK, FK, UNIQUE, CHECK).
-- ----------------------------------------------------------------------------
SELECT conrelid::regclass AS tabla,
       CASE contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
                    WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' END AS tipo,
       conname AS nombre,
       pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY 1, 2, 3;

SELECT tablename AS tabla, indexname AS indice, indexdef AS definicion
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY 1, 2;


-- ----------------------------------------------------------------------------
-- 11. Historial de migraciones Flyway (esperado: V1, V2, V3 en success).
-- ----------------------------------------------------------------------------
SELECT installed_rank, version, description, success, installed_on
FROM flyway_schema_history
ORDER BY installed_rank;
