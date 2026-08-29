# Auditoría de Backend — SIFIPRO

Fecha: 2026-08-29
Alcance: `sifipro-backend/src/main/java/com/puent/sifipro/**` — estructura de paquetes, entidades, aislamiento por tenant, controllers/endpoints, protección de autenticación/roles, gestión de tenants.
Método: revisión estática de código fuente (sin ejecutar, sin modificar nada).

---

## 1. Qué existe y funciona

### Estructura de paquetes/módulos
Arquitectura por dominio (package-by-feature), consistente en todos los módulos con subpaquetes `controller/`, `service/`, `repository/`, `entity/`, `dto/`:

```
com.puent.sifipro/
├── auth/            login, onboarding de tenant, JWT (JwtService, JwtAuthenticationFilter)
├── config/          SecurityConfig, CorsConfig, DevDataSeederConfig, JpaAuditingConfig, OpenApiConfig
├── customer/        Customer, perfil de cliente, historial de puntos
├── loyalty/         ProgramConfig (programas de fidelización)
├── redemption/       Redemption (canjes)
├── report/          reportes agregados (dashboard, rankings)
├── reward/          Reward (catálogo de recompensas)
├── shared/          BaseEntity, manejo global de excepciones, HealthController
├── tenant/          Tenant entity + repository (sin controller propio)
├── transaction/     PurchaseTransaction, PointsMovement (ledger)
└── user/            AppUser (usuarios internos ADMIN/STAFF)
```
Todas las entidades de negocio extienden `BaseEntity` ([shared/entity/BaseEntity.java](../../sifipro-backend/src/main/java/com/puent/sifipro/shared/entity/BaseEntity.java)), que aporta `id`, `createdAt`, `updatedAt` con auditoría JPA automática.

### Aislamiento por tenant: base de datos única compartida, aislamiento a nivel de aplicación
**No hay separación física** (ni esquemas por tenant, ni bases de datos separadas, ni Row-Level Security de PostgreSQL). Es un modelo **single-database, shared-schema** con `tenant_id` como discriminador:

- Todas las entidades de negocio (`Customer`, `ProgramConfig`, `Reward`, `Redemption`, `PurchaseTransaction`, `PointsMovement`, `AppUser`) tienen una relación `@ManyToOne` obligatoria (`optional = false`) hacia `Tenant` mapeada a la columna `tenant_id`.
- El aislamiento se aplica **en la capa de servicio**, no en la base de datos: cada método de servicio resuelve el tenant del usuario autenticado (`AppUser.getTenant().getId()` a partir del email del JWT) y todas las consultas de lectura/escritura usan repositorios con firma `findByIdAndTenantId(...)` / `findAllByTenantId...(...)`. Este patrón está implementado de forma **consistente** en `CustomerServiceImpl`, `ProgramConfigServiceImpl`, `RewardServiceImpl`, `RedemptionServiceImpl`, `PurchaseTransactionServiceImpl`, `CustomerProfileServiceImpl` y `UserServiceImpl`.
- Riesgo estructural inherente a este modelo: si **un solo** método de servicio olvida agregar el filtro `tenantId`, hay fuga de datos entre tenants inmediatamente (ver hallazgo crítico en la sección 2 — esto ya ocurrió en `ReportServiceImpl`).
- `AppUser.email` es `unique = true` **globalmente** (no `unique` compuesto con `tenant_id`), por lo que un mismo correo no puede registrarse en dos tenants distintos — limitación de diseño, no un bug.

### Autenticación y autorización
- JWT stateless vía `JwtAuthenticationFilter` + `JwtService` (`auth/security/`), con `SecurityConfig` ([config/SecurityConfig.java](../../sifipro-backend/src/main/java/com/puent/sifipro/config/SecurityConfig.java)) configurando reglas de autorización por ruta y método HTTP, coherentes con los roles `ADMIN`/`STAFF` (`user/entity/UserRole.java`).
- Passwords con BCrypt (`PasswordEncoder`), autenticación delegada a `DaoAuthenticationProvider` + `CustomUserDetailsService`.
- Manejo de errores de autenticación/autorización centralizado (`RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`, `GlobalExceptionHandler`).

### Endpoints funcionales y correctamente aislados por tenant
Todos los módulos de negocio (`customers`, `program-config`, `rewards`, `redemptions`, `transactions`, `users`) resuelven el tenant desde el JWT (`Authentication.getName()` → email → `AppUser.tenant`) y filtran consistentemente. Verificado leyendo cada `*ServiceImpl`.

### Seeder de datos demo
`DevDataSeederConfig` (perfil `dev`) crea un tenant "Demo Tenant" con usuarios `admin@sifipro.com` / `staff@sifipro.com` y datos de ejemplo, solo si la base está vacía — reutiliza los propios servicios (no bypassa el aislamiento).

---

## 2. Qué existe pero está roto o incompleto

### 🔴 CRÍTICO — Fuga de datos entre tenants en `/api/reports/*`
[report/service/ReportServiceImpl.java](../../sifipro-backend/src/main/java/com/puent/sifipro/report/service/ReportServiceImpl.java) es el **único** servicio de negocio que rompe el patrón de aislamiento del resto del backend:
- `getDashboardSummary()`, `getTopCustomers()`, `getTopRedeemedRewards()` usan `customerRepository.findAll()`, `rewardRepository.findAll()`, `redemptionRepository.findAll()`, `purchaseTransactionRepository.count()`, `pointsMovementRepository.findAll()` — **sin ningún filtro por `tenantId`**.
- `ReportController` ([report/controller/ReportController.java](../../sifipro-backend/src/main/java/com/puent/sifipro/report/controller/ReportController.java)) ni siquiera recibe el parámetro `Authentication` en sus tres métodos — confirma que el tenant del usuario nunca se resuelve ni se usa.
- Impacto real: cualquier usuario autenticado con rol `ADMIN` o `STAFF` de **cualquier tenant** puede llamar `GET /api/reports/dashboard`, `GET /api/reports/top-customers` o `GET /api/reports/top-redeemed-rewards` y ver totales, nombres, emails y balances de puntos de **todos los clientes de todos los tenants** del sistema, no solo el suyo.
- La protección de `SecurityConfig` (autenticación + rol) sí funciona a nivel de endpoint, pero eso es insuficiente: el problema es de aislamiento de datos dentro del handler, no de acceso al endpoint.

### Migraciones de esquema fuera de control de versiones real
Confirmado también desde la perspectiva de backend: `spring.jpa.hibernate.ddl-auto=update` gestiona el esquema automáticamente y Flyway está deshabilitado (`spring.flyway.enabled=false` en [application.properties](../../sifipro-backend/src/main/resources/application.properties)) pese a que las dependencias de Flyway están en el `pom.xml`. El único script de migración explícito, `V6__refactor_transactions_program_scope.sql`, vive en `db/manual-applied/` y no se ejecuta automáticamente con ningún mecanismo — nadie garantiza que se haya aplicado en todos los entornos.

### Gestión de roles inconsistente con lo documentado en el README
El README indica que "Recompensas" (`/api/rewards`) tiene acceso `ADMIN, STAFF`, pero al inspeccionar `SecurityConfig` el rol `STAFF` solo tiene permiso de **lectura** (`GET`) sobre `/api/rewards/**`; crear, actualizar, activar o desactivar recompensas requiere `ADMIN` (cae en la regla catch-all `hasRole("ADMIN")` porque `POST /api/rewards` no está en la lista de rutas permitidas para `STAFF`). No es un bug de seguridad (es más restrictivo, no menos), pero la documentación no refleja el comportamiento real por método HTTP.

### Cobertura de tests prácticamente inexistente
Solo existe [SifiproBackendApplicationTests.java](../../sifipro-backend/src/test/java/com/puent/sifipro/SifiproBackendApplicationTests.java) (el test de contexto por defecto de Spring Boot). No hay tests unitarios ni de integración para ningún servicio, a pesar de que `pom.xml` incluye dependencias `*-test` completas (`spring-boot-starter-security-test`, `spring-boot-starter-data-jpa-test`, etc.). El bug de fuga de tenant en reportes es exactamente el tipo de regresión que un test de integración por tenant habría detectado.

### Documentación Swagger/OpenAPI pública sin restricción
`/v3/api-docs/**`, `/swagger-ui.html` y `/swagger-ui/**` están en `permitAll()` — accesibles sin autenticación. Coherente con el propósito documentado (debug), pero expone la superficie completa de la API (incluyendo el endpoint de reportes vulnerable) a cualquiera con acceso de red al puerto `8085`.

---

## 3. Qué falta por completo

### No existe gestión de tenants como API
No hay `TenantController` ni ningún endpoint bajo `/api/tenants/**`. La única operación relacionada con tenants es la creación implícita dentro de `POST /api/auth/onboarding` (crea el `Tenant` + su primer usuario `ADMIN` en una sola transacción, en `AuthServiceImpl.onboarding()`). No existe:
- Listado de tenants (probablemente ni debería existir para usuarios normales, pero tampoco hay un rol "super-admin"/plataforma que pueda administrarlos).
- Actualización de datos del tenant (nombre, código).
- Activar/desactivar un tenant (el campo `Tenant.active` existe en la entidad y se persiste como `true` al crear, pero **ningún código lo lee ni lo modifica después** — es un campo muerto).
- Eliminación o suspensión de tenant.
- Cualquier noción de planes, límites de uso, o facturación por tenant.

`TenantRepository` ([tenant/repository/TenantRepository.java](../../sifipro-backend/src/main/java/com/puent/sifipro/tenant/repository/TenantRepository.java)) solo expone `findByCodeIgnoreCase` y `existsByCodeIgnoreCase`, usados exclusivamente por el flujo de onboarding — no hay `findAll`, `findById` expuesto a nivel de servicio/controller, ni operaciones de actualización.

### No hay control de acceso "cross-tenant" a nivel de plataforma
No existe un rol superior a `ADMIN` (p. ej. "PLATFORM_OWNER" o "SUPPORT") capaz de operar legítimamente sobre múltiples tenants. Esto refuerza que el bug de `ReportServiceImpl` no es una funcionalidad "a medias" de administración de plataforma — es un descuido de scoping, ya que no existe ningún camino intencional para ver datos entre tenants.

### No hay soft-delete ni auditoría de cambios más allá de `createdAt`/`updatedAt`
`BaseEntity` solo registra fecha de creación/actualización; no hay campo `deletedAt`, ni tabla de auditoría de quién hizo qué cambio (solo hay trazabilidad de movimientos de puntos vía `points_movements`, que es específico del dominio de lealtad, no un audit log genérico).

### No hay rate limiting, ni protección contra fuerza bruta en `/api/auth/login`
No se observa ningún mecanismo de bloqueo de cuenta ni límite de intentos en `AuthServiceImpl.login()`.

---

## Tabla de endpoints existentes

| Método | Ruta | Protección (SecurityConfig) | Aislamiento por tenant | Estado |
|---|---|---|---|---|
| POST | `/api/auth/onboarding` | Pública (`permitAll`) | Crea tenant nuevo (N/A) | ✅ Funcional |
| POST | `/api/auth/login` | Pública (`permitAll`) | N/A | ✅ Funcional |
| GET | `/api/auth/me` | Autenticado | Vía `AppUser.tenant` | ✅ Funcional |
| GET | `/api/health` | Pública (`permitAll`) | N/A | ✅ Funcional |
| GET | `/actuator/health`, `/actuator/info` | Pública (`permitAll`) | N/A | ✅ Funcional |
| GET | `/v3/api-docs/**`, `/swagger-ui.html`, `/swagger-ui/**` | Pública (`permitAll`) | N/A | ⚠️ A medias (expone la API completa sin auth) |
| POST | `/api/customers` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/customers` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/customers/{id}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| PUT | `/api/customers/{id}` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/customers/{id}/activate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/customers/{id}/deactivate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/customers/{id}/profile` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/customers/{id}/points-history` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| POST | `/api/program-config` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/program-config` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/program-config/{id}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| PUT | `/api/program-config/{id}` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/program-config/{id}/activate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/program-config/{id}/deactivate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| POST | `/api/rewards` | ADMIN (no STAFF, pese a README) | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/rewards` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/rewards/programs/{programConfigId}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/rewards/{id}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| PUT | `/api/rewards/{id}` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/rewards/{id}/activate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/rewards/{id}/deactivate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| POST | `/api/redemptions` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/redemptions` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/redemptions/{id}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/redemptions/customer/{customerId}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| POST | `/api/transactions` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/transactions` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/transactions/program/{programConfigId}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/transactions/{id}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/transactions/customer/{customerId}` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/transactions/points-movements` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/transactions/program/{programConfigId}/points-movements` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/transactions/customer/{customerId}/points-movements` | ADMIN, STAFF | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/reports/dashboard` | ADMIN, STAFF | ❌ **Sin filtro — expone todos los tenants** | 🔴 **Roto (fuga de datos)** |
| GET | `/api/reports/top-customers` | ADMIN, STAFF | ❌ **Sin filtro — expone todos los tenants** | 🔴 **Roto (fuga de datos)** |
| GET | `/api/reports/top-redeemed-rewards` | ADMIN, STAFF | ❌ **Sin filtro — expone todos los tenants** | 🔴 **Roto (fuga de datos)** |
| POST | `/api/users` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/users` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| GET | `/api/users/{id}` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PUT | `/api/users/{id}` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/users/{id}/activate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/users/{id}/deactivate` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| PATCH | `/api/users/{id}/password` | ADMIN | ✅ Filtrado por tenant | ✅ Funcional |
| — | `/api/tenants/**` (gestión de tenants) | — | — | ⚫ **No existe** (ver sección 3) |

Leyenda: ✅ Funcional · ⚠️ A medias · 🔴 Roto · ⚫ Inexistente
