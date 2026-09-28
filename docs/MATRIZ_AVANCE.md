# Matriz de avance — SIFIPRO (Avance 1)

> **Fecha de corte:** 2026-09-27 · **Rama:** `feature/avance1-mejoras`
> **Requerimientos:** los de la propuesta aprobada (Entregable 1), con su numeración original. Cada uno se verificó contra el código y el sistema en ejecución; lo que falta se indica explícitamente.
> **Credenciales de los escenarios:** `platform-admin@sifipro.com / PlatformAdmin123!` (platform-ui, http://localhost:5174); `admin@sifipro.com / Admin123!`, `staff@sifipro.com / Staff123!` y `admin@cafenorte.com / Admin123!` (tenant-ui, http://localhost:5173). Datos demo tras `docker compose down -v && docker compose up --build -d`.

**Estados:** *Finalizado* = implementado de extremo a extremo y verificado con el escenario indicado · *En desarrollo* = funciona una parte y se indica qué falta · *Pendiente* = no implementado.

## 1. Requerimientos funcionales

| ID | Requerimiento | Estado | % | Evidencia (pantalla / endpoint + escenario de prueba) |
|---|---|---|---|---|
| RF-01 | Registrar un tenant indicando nombre, datos de contacto y subdominio. | En desarrollo | 60 | platform-ui **Tenants → New Tenant**; `POST /api/platform/tenants`. Se registra con **nombre** y un **código** único (p. ej. `cafe-norte`), junto con su primer ADMIN (nombre, email, contraseña); código o email duplicado → 409. **Falta:** (1) la tabla `tenants` solo guarda `name`, `code` y `active`, así que no hay datos de contacto del comercio (teléfono, dirección, email de contacto); (2) el código funciona como identificador, pero **no hay subdominio real**: no existe DNS comodín ni se resuelve el tenant por el host (el tenant se deduce del usuario autenticado). |
| RF-02 | Aprovisionar automáticamente el espacio de datos aislado del nuevo tenant. | Finalizado | 100 | Al crear el tenant, su espacio queda listo en la misma transacción (fila en `tenants` + primer ADMIN), sin pasos manuales ni DDL. Escenario: crear un tenant en platform-ui, entrar con su ADMIN a tenant-ui y ver listas vacías, sin datos de otros comercios. Smoke test E2E: tenant nuevo → programa → cliente → compra → canje → reporte, todo aislado. El aislamiento es por `tenant_id` en un esquema compartido, no por esquema propio (ver sección 5). |
| RF-03 | Suspender y reactivar un tenant desde Platform UI. | Finalizado | 100 | platform-ui **Deactivate** (con confirmación) / **Activate**; `PATCH /api/platform/tenants/{id}/deactivate\|activate`. Con la sesión del ADMIN del tenant abierta, suspender → en la siguiente acción tenant-ui cierra sesión con aviso, los tokens ya emitidos responden 401 `TENANT_SUSPENDED` y el login responde *"Tenant account is suspended."*; al reactivar vuelve a operar. Pruebas `AuthServiceImplTest`, `JwtAuthenticationFilterTest`. |
| RF-04 | El administrador de comercio configura las reglas de acumulación de puntos. | Finalizado | 100 | tenant-ui **Programs** (solo ADMIN); `/api/program-config`. Cada programa define puntos por dólar y compra mínima, y puede activarse o desactivarse; un tenant puede tener varios programas. Escenario: programa 1.5 pts/$ y mínimo $25 → compra de $80 da 120 pts y de $20 da 0 pts. |
| RF-05 | Registrar clientes finales dentro de un tenant. | Finalizado | 100 | tenant-ui **Customers → New Customer**; `POST /api/customers` (ADMIN y STAFF). El email es único por tenant (restricción en la BD, V3): el mismo email puede existir en dos tenants (201 en ambos), no dos veces en el mismo (400). |
| RF-06 | Otorgar puntos a un cliente por una compra. | Finalizado | 100 | tenant-ui **Transactions → New Transaction**; `POST /api/transactions`. Los puntos se calculan en el backend (`monto × pts/$`, 0 si es menor al mínimo), se suman al saldo y se registra un movimiento EARN. Solo se ofrecen clientes activos. |
| RF-07 | Canjear puntos por un beneficio configurado. | Finalizado | 100 | tenant-ui **Redemptions → New Redemption** (muestra el saldo del cliente en el programa y bloquea si no alcanza); `POST /api/redemptions`. Valida cliente y recompensa activos, stock y saldo por programa; bloqueo optimista contra sobreventa. Escenario: recompensa con stock 1 → primer canje 201, segundo 400 "out of stock". |
| RF-08 | Autenticar usuarios y diferenciar permisos por rol (plataforma, comercio, cliente). | En desarrollo | 65 | **Plataforma:** `PLATFORM_ADMIN` en platform-api, con JWT y secreto propios. **Comercio:** `ADMIN` y `STAFF` en tenant-api, con permisos distintos en API e interfaz (STAFF → 403 en usuarios, programas, gestión de recompensas y ajustes). Rechazo cruzado de tokens entre planos verificado (401). **Falta:** no existe el rol **cliente** ni un portal para el cliente final: los clientes son registros gestionados por el comercio, sin credenciales ni acceso propio (2 de los 3 tipos de actor implementados). |
| RF-09 | Registrar en una bitácora de auditoría cada otorgamiento, canje o ajuste de puntos. | Finalizado | 100 | Cada otorgamiento (EARN), canje (REDEEM) y ajuste manual (ADJUSTMENT) queda en `points_movements` con autor (`created_by`, con FK) y fecha; los ajustes exigen motivo (V4). **Ajustes:** perfil del cliente → **Adjust points** (solo ADMIN); `POST /api/customers/{id}/adjustments`. **Bitácora:** tenant-ui **Audit Log** (solo ADMIN, filtros por fechas, tipo, cliente y usuario); `GET /api/audit/points-movements`. Escenario verificado: +50 y −20 a Laura Mendoza → aparecen con `admin@sifipro.com` y su motivo; saldo = ledger en los 19 clientes; la bitácora de cafe-norte no muestra movimientos de demo. Pruebas `PointsAdjustmentServiceImplTest` y `AuditAndAdjustmentIntegrationTest`. La bitácora es de solo inserción por diseño de la aplicación (no hay endpoints que la modifiquen); la BD no lo impide con triggers. |
| RF-10 | Reportes básicos de puntos otorgados y canjeados para el administrador de comercio. | Finalizado | 100 | tenant-ui **Reports** y **Dashboard**; `/api/reports/**` (Swagger). Filtros por periodo (7 días, 30 días, este mes, 4 meses, rango personalizado), puntos emitidos vs canjeados por día o mes, top clientes y recompensas, alertas de stock y exportación CSV. Escenario: demo, SIFIPRO Rewards, últimos 4 meses → 41 compras, 14 730 pts emitidos, 4 100 canjeados; coinciden con SQL directo. |

## 2. Requerimientos no funcionales

| ID | Requerimiento | Estado | % | Evidencia |
|---|---|---|---|---|
| RNF-01 | Aislamiento de datos entre tenants. | Finalizado | 100 | Todas las consultas filtran por el tenant del usuario autenticado; un recurso de otro tenant responde 404. `ReportTenantIsolationIntegrationTest` y `AuditAndAdjustmentIntegrationTest` lo prueban contra PostgreSQL real (Testcontainers). Escenario: con `admin@cafenorte.com` solo se ven sus datos. |
| RNF-02 | HTTPS + autenticación JWT. | En desarrollo | 50 | **JWT:** HS512, 24 h, secretos distintos por plano, validación del usuario y del tenant en cada petición. **HTTPS: no implementado.** Hoy todo corre por HTTP en local (nginx escucha en el puerto 80, sin certificados ni TLS). |
| RNF-03 | Acciones principales en 3 clics o menos. | Finalizado | 100 | Conteo manual de clics (no es un estudio de usabilidad), con el programa ya elegido en el Dashboard: registrar cliente = Customers → New Customer → Create (3); registrar compra = Transactions → New Transaction → Create Transaction (3); canjear = Redemptions → New Redemption → Create Redemption (3); ver reportes = Reports (1); crear tenant = New Tenant → Create Tenant (2); suspender = Deactivate → confirmar (2). El ajuste manual de puntos, acción secundaria, requiere 4 (Customers → cliente → Adjust points → Apply). |
| RNF-04 | Ambiente reproducible con Docker. | Finalizado | 100 | `docker compose down -v && docker compose up --build -d` levanta los 5 contenedores, aplica las migraciones V1–V4 y siembra los datos demo; verificado en limpio en este cierre. |
| RNF-05 | Arquitectura en capas + pruebas automatizadas. | En desarrollo | 75 | **Capas:** controller → service → repository → entity/DTO en ambos backends, con manejo global de errores. **Pruebas:** 35 pruebas automatizadas aprobadas (32 en tenant-api, incluidas 9 de integración con Testcontainers, y 3 en platform-api). **Falta:** pruebas de frontend, pipeline de CI, y migrar a Testcontainers las 5 pruebas de integración antiguas que dependen de una BD local. |
| RNF-06 | Agregar tenants sin cambios estructurales. | Finalizado | 100 | Crear un tenant solo inserta filas; no ejecuta DDL ni requiere migraciones ni reinicios. Escenario: el smoke test crea el tenant `smoke-test` con el sistema en marcha y lo opera de inmediato. |

## 3. Avance global

Promedio simple de los 10 requerimientos funcionales:

```
(RF-01 60 + RF-02 100 + RF-03 100 + RF-04 100 + RF-05 100
 + RF-06 100 + RF-07 100 + RF-08 65 + RF-09 100 + RF-10 100) / 10
= 925 / 10 = 92.5 %
```

**Avance global: 92.5 %** (8 finalizados y 2 en desarrollo: RF-01 y RF-08). Los RNF no entran en este promedio; su estado se reporta en la sección 2.

## 4. Funcionalidades adicionales no comprometidas en la propuesta

| Funcionalidad | Evidencia |
|---|---|
| Suspensión con corte inmediato de sesiones (los tokens ya emitidos dejan de valer) | Smoke test E2E, pasos de suspensión: 401 `TENANT_SUSPENDED` |
| Reportes validados contra SQL directo | Comparación de 11 campos × 2 programas × 3 periodos, todos iguales; prueba de integración |
| Exportación CSV (resumen y compras), compatible con Excel en español | `GET /api/reports/export/*.csv` (separador `;`, BOM UTF-8, protección contra inyección de fórmulas) |
| Saldo del cliente por programa, con el mismo cálculo que valida el canje | `GET /api/redemptions/customer/{id}/program/{programId}/balance`; modal de canje y de ajuste |
| Prueba de aislamiento entre tenants con Testcontainers (PostgreSQL real) | `ReportTenantIsolationIntegrationTest`, `AuditAndAdjustmentIntegrationTest` |
| Restricciones de integridad en la base de datos (V3) | CHECK de stock, saldo, montos y coherencia rol/tenant; FK de autoría; índices |
| Protección contra escalada de rol | Un ADMIN no puede asignar PLATFORM_ADMIN; platform-api solo acepta operadores sin tenant; CHECK en BD |
| 35 pruebas automatizadas (unitarias e integración) | `mvn clean test` en ambos backends |
| Datos demo con dos tenants y cuatro meses de actividad | Seeder `dev`: `demo` y `cafe-norte` |

## 5. Cambios respecto a la propuesta

| Propuesta | Implementado | Justificación |
|---|---|---|
| Aislamiento **schema-per-tenant** | **Esquema compartido con `tenant_id`** en cada tabla y filtro por tenant en cada consulta | Una sola migración Flyway sirve para todos los tenants y crear un tenant no ejecuta DDL, lo que cumple RNF-06 de forma directa. El riesgo de fuga que la propuesta asociaba a este modelo se mitiga con filtros en todas las consultas y con pruebas de aislamiento sobre PostgreSQL real (Testcontainers). |
| **Keycloak** como proveedor de identidad | **JWT propio** con secretos separados por plano (plataforma y comercio) | La propuesta ya listaba Keycloak como riesgo (curva de aprendizaje y configuración). Se priorizó el aislamiento entre planos: un token de un plano no es válido en el otro (verificado, 401 en ambos sentidos). Keycloak queda como evolución futura. |
| **Java 21** | **Java 17** | Es la versión del proyecto heredado sobre el que se construyó; migrar de versión no aportaba a los requerimientos del Avance 1. |
| **CI con GitHub Actions** y **HTTPS** | Pendientes | Planificados para el Avance 2 (ver `docs/CAMBIOS_AVANCE1.md`, sección d). |

## 6. Comparación con el cronograma

| Actividad (propuesta) | Periodo planificado | Estado al 2026-09-27 |
|---|---|---|
| Tenant Backend / Tenant UI | 28/09 – 11/10 | **Adelantado.** Clientes, programas, compras, canjes, recompensas, usuarios, reportes y bitácora ya funcionan y están verificados antes de que empiece el periodo (alrededor de 2 semanas de adelanto). |
| Auditoría | 19/10 – 25/10 | **Adelantado.** La bitácora de auditoría de puntos (RF-09) está completa y la auditoría técnica del sistema ya está documentada en `docs/AUDITORIA_AVANCE_1.md` (alrededor de 3 semanas de adelanto). |

Lo que queda del Avance 1 dentro del cronograma: completar RF-01 (datos de contacto y subdominio) y RF-08 (rol y portal del cliente final), además de HTTPS y CI.
