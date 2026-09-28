# Matriz de avance — SIFIPRO (Avance 1)

> **Fecha de corte:** 2026-09-27 · **Rama:** `feature/avance1-mejoras`
> **Origen de los requerimientos:** no se adjuntó la propuesta original del proyecto, así que la numeración RF-01…RF-24 se **reconstruyó** a partir del sistema implementado y de los pendientes identificados en `docs/AUDITORIA_AVANCE_1.md` (sección D2). Si la propuesta original usa otra numeración, esta matriz debe re-mapearse a ella; ningún requerimiento pendiente se marcó como terminado.

## Criterios

| Estado | Significado |
|---|---|
| **Finalizado** | Implementado de extremo a extremo (API + interfaz cuando aplica) y verificado con el escenario indicado. |
| **En desarrollo** | Existe una parte funcional, pero falta completar el requerimiento. |
| **Pendiente** | No implementado (a lo sumo existe el modelo de datos). |

**Peso:** 1 = baja complejidad, 2 = media, 3 = alta. El % global es el promedio ponderado por peso.

**Credenciales de los escenarios:** `platform-admin@sifipro.com / PlatformAdmin123!` (http://localhost:5174), `admin@sifipro.com / Admin123!`, `staff@sifipro.com / Staff123!` y `admin@cafenorte.com / Admin123!` (http://localhost:5173). Datos demo tras `docker compose down -v && docker compose up --build -d`.

## Requerimientos funcionales

### Plano de plataforma

| ID | Requerimiento | Peso | Estado | % | Evidencia (pantalla / endpoint + escenario verificable) |
|---|---|---|---|---|---|
| RF-01 | Autenticación de operadores de plataforma (rol PLATFORM_ADMIN, sesión separada del plano tenant) | 2 | Finalizado | 100 | platform-ui `/login`; `POST /api/platform/auth/login`. Entrar con el operador → pantalla Tenants. Entrar con `admin@sifipro.com` → *"Invalid email or password, or insufficient privileges."* (401). Prueba `CustomUserDetailsServiceTest`. |
| RF-02 | Alta de un comercio (tenant) junto con su primer ADMIN | 3 | Finalizado | 100 | platform-ui Tenants → **New Tenant**; `POST /api/platform/tenants`. Crear tenant y entrar a tenant-ui con su ADMIN: funciona de inmediato. Código o email duplicado → error 409 en el formulario. |
| RF-03 | Listado y consulta de tenants | 1 | Finalizado | 100 | platform-ui Tenants (tabla con estado y fecha); `GET /api/platform/tenants` (paginado) y `GET /api/platform/tenants/{id}`. |
| RF-04 | Activación y suspensión de tenants con efecto inmediato | 2 | Finalizado | 100 | platform-ui **Deactivate / Activate**; `PATCH /api/platform/tenants/{id}/deactivate\|activate`. Con la sesión del ADMIN abierta, suspender → en la siguiente acción tenant-ui cierra sesión con aviso; los tokens ya emitidos responden 401 `TENANT_SUSPENDED`. Reactivar → vuelve a operar. Pruebas `AuthServiceImplTest`, `JwtAuthenticationFilterTest`. |
| RF-05 | Edición de datos del tenant y métricas agregadas de toda la plataforma | 2 | Pendiente | 0 | No existe endpoint de edición ni pantalla de métricas cross-tenant. |

### Plano de tenant — acceso y usuarios

| ID | Requerimiento | Peso | Estado | % | Evidencia |
|---|---|---|---|---|---|
| RF-06 | Autenticación de usuarios del comercio y manejo de sesión | 2 | Finalizado | 100 | tenant-ui `/login`; `POST /api/auth/login`, `GET /api/auth/me`. Entrar con admin → Dashboard; recargar la página mantiene la sesión; Logout vuelve al login. |
| RF-07 | Gestión de usuarios internos (alta, edición, activación, cambio de contraseña por el ADMIN) | 2 | Finalizado | 100 | tenant-ui **Users** (solo ADMIN); `/api/users`. Crear un STAFF y entrar con él. Desactivarse a sí mismo → *"You cannot deactivate your own account."*; asignar PLATFORM_ADMIN por API → 400. Prueba `UserServiceImplTest`. |
| RF-08 | Cambio de contraseña propia y recuperación de contraseña | 1 | Pendiente | 0 | Solo el ADMIN puede cambiar contraseñas de otros usuarios; no hay auto-servicio ni recuperación por correo. |
| RF-09 | Control de acceso por rol (ADMIN / STAFF) en API e interfaz | 2 | Finalizado | 100 | Con staff: el menú no muestra Users ni Programs; Clientes y Recompensas no muestran acciones de gestión; `GET /api/users` → 403; `POST /api/rewards` → 403. |

### Plano de tenant — programa de lealtad

| ID | Requerimiento | Peso | Estado | % | Evidencia |
|---|---|---|---|---|---|
| RF-10 | Configuración de programas de lealtad (varios por tenant: puntos por dólar, compra mínima, activo) | 2 | Finalizado | 100 | tenant-ui **Programs**; `/api/program-config`. Crear un programa, elegirlo en el selector del Dashboard; nombre repetido → 400. |
| RF-11 | Registro y gestión de clientes (alta, edición, activación) con email único por tenant | 2 | Finalizado | 100 | tenant-ui **Customers**; `/api/customers`. El mismo email puede existir en dos tenants (201 en ambos) pero no dos veces en el mismo (400). Restricción en BD desde V3. |
| RF-12 | Perfil del cliente (saldo, tier, progreso, estadísticas, historial y gráfica de puntos) | 2 | Finalizado | 100 | tenant-ui `/customers/:id`. Laura Mendoza: GOLD, 2 165 pts, "Highest tier reached"; gráfica de junio a septiembre. `GET /api/customers/{id}/profile` y `/points-history`. |
| RF-13 | Registro de compras con acumulación automática de puntos | 3 | Finalizado | 100 | tenant-ui **Transactions → New Transaction**; `POST /api/transactions`. Programa 1.5 pts/$ y mínimo $25: compra de $80 → 120 pts; $20 → 0 pts. Solo se ofrecen clientes activos. |
| RF-14 | Ledger de movimientos de puntos con trazabilidad y autor de cada operación | 2 | Finalizado | 100 | Tabla de movimientos en **Transactions**; `GET /api/transactions/program/{id}/points-movements`. Consulta 2b de `docs/database/consultas-demo.sql`: 0 clientes con saldo ≠ ledger; `created_by` con FK (V3). |
| RF-15 | Catálogo de recompensas por programa con stock e imagen | 2 | Finalizado | 100 | tenant-ui **Rewards**; `/api/rewards`. Crear una recompensa con imagen (vista previa); editar solo el stock conserva la imagen. |
| RF-16 | Canje de recompensas con validación de saldo por programa, stock y concurrencia | 3 | Finalizado | 100 | tenant-ui **Redemptions → New Redemption**: muestra el saldo del cliente en ese programa y bloquea si no alcanza; `POST /api/redemptions`. Recompensa con stock 1: primer canje 201, segundo 400 "out of stock". Bloqueo optimista con test de concurrencia. |
| RF-17 | Cancelación/reversa de canjes y anulación de compras | 2 | Pendiente | 0 | El estado `CANCELLED` existe en el modelo y en la BD, pero no hay endpoint, servicio ni pantalla. |
| RF-18 | Clasificación de clientes por niveles (Bronze / Silver / Gold) | 1 | Finalizado | 100 | Perfil y reportes; umbrales 500 y 2 000 calculados en el backend (`CustomerTier`). Mariana Rivas (840 pts): SILVER, "1,160 pts to Gold". Los umbrales son fijos (no configurables por tenant). |
| RF-19 | Ajustes manuales y expiración de puntos | 2 | Pendiente | 0 | Los tipos `ADJUSTMENT` y `EXPIRE` existen en el modelo, pero ningún flujo los genera. |

### Plano de tenant — análisis y operación

| ID | Requerimiento | Peso | Estado | % | Evidencia |
|---|---|---|---|---|---|
| RF-20 | Dashboard operativo por programa (métricas, actividad reciente, stock bajo) | 2 | Finalizado | 100 | tenant-ui `/dashboard`; `GET /api/reports/summary`, `/recent-activity`, `/stock-alerts`. Cambiar de programa en el selector recarga todo. |
| RF-21 | Reportes por periodo con gráficas, rankings y exportación CSV | 3 | Finalizado | 100 | tenant-ui **Reports** (presets y rango personalizado, por día o mes, 3 gráficas, top clientes y recompensas, alertas de stock, 2 CSV); `/api/reports/**` (Swagger). Demo, SIFIPRO Rewards, últimos 4 meses: 41 compras, $9,860, 14,730 pts emitidos; coinciden con SQL directo. |
| RF-22 | Aislamiento de datos entre comercios (multi-tenant) | 3 | Finalizado | 100 | Entrar con `admin@cafenorte.com`: solo sus 4 clientes y sus reportes; pedir un programa o cliente de demo por API → 404. Prueba `ReportTenantIsolationIntegrationTest` (PostgreSQL real con Testcontainers). |
| RF-23 | Búsqueda, filtros y paginación en los listados | 1 | En desarrollo | 10 | Solo el listado de tenants de platform-api está paginado en el backend; ninguna tabla de tenant-ui tiene búsqueda ni paginación. |
| RF-24 | Bitácora de acciones administrativas (quién activó, editó o suspendió qué) | 1 | Pendiente | 0 | Solo compras, canjes y movimientos registran `created_by`; no hay bitácora de cambios administrativos. |

## Resumen y avance global

| Estado | Requerimientos | Peso total |
|---|---|---|
| Finalizado | 18 (RF-01–04, 06, 07, 09–16, 18, 20–22) | 39 |
| En desarrollo | 1 (RF-23) | 1 |
| Pendiente | 5 (RF-05, 08, 17, 19, 24) | 8 |
| **Total** | **24** | **48** |

**Avance global ponderado** = Σ(peso × %) / Σ peso = (39 × 100 + 1 × 10 + 8 × 0) / 48 = 3 910 / 48 = **81.5 %**

(Sin ponderar: 18 de 24 requerimientos finalizados = 75 %; promedio simple de % = 75.4 %.)

## Requerimientos no funcionales (informativo, no suma al % global)

| ID | Requerimiento | Estado | Evidencia |
|---|---|---|---|
| RNF-01 | Seguridad: JWT por plano, roles, BCrypt, suspensión inmediata | Finalizado | Smoke test E2E 36/36 del cierre; pruebas unitarias de seguridad. |
| RNF-02 | Integridad de datos en BD (restricciones, FKs, migraciones versionadas) | Finalizado | Flyway V1–V3; consultas de `docs/database/consultas-demo.sql`. |
| RNF-03 | Despliegue reproducible con Docker Compose | Finalizado | `docker compose down -v && docker compose up --build -d` deja la demo lista. |
| RNF-04 | Documentación de la API | En desarrollo | Swagger completo en tenant-api; platform-api sin Swagger. |
| RNF-05 | Pruebas automatizadas | En desarrollo | 25 pruebas sin BD de desarrollo aprobadas (22 tenant-api + 3 platform-api); sin pruebas de frontend. |
| RNF-06 | Integración continua (build y pruebas automáticas por cambio) | Pendiente | No hay pipeline de CI. |
