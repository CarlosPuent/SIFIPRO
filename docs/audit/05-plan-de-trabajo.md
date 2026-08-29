# Plan de Trabajo — Separación en platform-api / tenant-api / platform-ui / tenant-ui

Fecha: 2026-08-29
Base: [01-infra.md](01-infra.md), [02-backend.md](02-backend.md), [03-logica.md](03-logica.md), [04-frontend.md](04-frontend.md)
Objetivo: dividir el monolito actual (`sifipro-backend` + `sifipro-frontend`) en cuatro despliegues — `platform-api`, `tenant-api`, `platform-ui`, `tenant-ui` — priorizando el trabajo según lo que ya funciona, lo que necesita ajuste, y lo que no existe.

---

## 0. Cómo se traza la línea platform / tenant

Antes de tocar código hace falta fijar el criterio de corte, porque hoy **no existe ningún concepto de "plataforma"** en el sistema — todo lo que hay es tenant-scoped o público:

- **`tenant-api`** hereda directamente el backend actual: todo lo que un `ADMIN`/`STAFF` de un tenant hace hoy (`customers`, `program-config`, `rewards`, `redemptions`, `transactions`, `users`, `auth/login`, `auth/me`, `reports` operacionales). Sigue siendo multi-tenant (un solo deployable sirve a todos los tenants, aislado por `tenant_id` como hoy), no "un backend por tenant".
- **`platform-api`** es **nuevo por completo**: administra tenants como entidad de negocio (alta, baja, suspensión, planes), y es el único que puede ver datos agregados **entre** tenants. Hoy esto no existe como rol ni como API — solo existe el bug de `ReportServiceImpl` que expone eso mismo sin querer y sin autorización (ver [02-backend.md §2](02-backend.md)).
- **`tenant-ui`** es, en la práctica, un fork del `sifipro-frontend` actual (todas sus páginas son tenant-scoped, confirmado en [04-frontend.md](04-frontend.md)).
- **`platform-ui`** es **nueva por completo**: no existe ninguna pantalla hoy para administrar tenants, ver métricas cross-tenant, ni gestionar planes/suspensiones.

**Decisión que hay que tomar antes de planificar en detalle** (no es técnica, es de producto): ¿quién opera `platform-ui`? ¿Personal interno de SIFIPRO (operador de la plataforma SaaS) o también los `ADMIN` de cada tenant (p. ej. para ver su plan/facturación)? Esto determina si `platform-api` necesita un tercer tipo de usuario (`PlatformOperator`, sin relación a ningún tenant) o si reutiliza `AppUser` con un rol adicional. El resto de este plan asume la opción más común en SaaS B2B: un rol de plataforma separado, sin tenant, gestionado aparte de `AppUser`.

---

## 1. Qué se puede reutilizar tal cual

Código que se puede **mover** (copiar/mantener) a su destino sin reescribirlo, más allá de ajustes de import/paquete:

### → `tenant-api` (reutilización directa, alta confianza)
- **Módulos de dominio completos**: `customer/`, `loyalty/`, `reward/`, `redemption/`, `transaction/`, `user/` (controller + service + repository + entity + dto). Confirmado en [02-backend.md §1](02-backend.md) que el patrón de aislamiento por `tenant_id` está implementado de forma consistente en los siete servicios de negocio (todos excepto `report`). Es el activo más valioso del proyecto y no necesita reescritura, solo reempaquetado.
- **Infraestructura de autenticación JWT**: `JwtService`, `JwtAuthenticationFilter`, `CustomUserDetailsService`, `RestAuthenticationEntryPoint`, `RestAccessDeniedHandler` — funciona y está bien separada de la lógica de negocio.
- **`shared/`**: `BaseEntity`, `GlobalExceptionHandler`, `BusinessException`, `ResourceNotFoundException`, `ApiErrorResponse` — utilidades transversales sin acoplamiento a un dominio específico.
- **Lógica de acumulación y canje de puntos**: el flujo de `PurchaseTransactionServiceImpl`/`RedemptionServiceImpl` es correcto en su regla de negocio (ver [03-logica.md §1](03-logica.md)); se traslada tal cual y se corrigen sus riesgos de concurrencia como refactor incidental (sección 2), no como reescritura.
- **`Dockerfile` de backend** (multi-stage, usuario no-root) — el patrón se clona para `platform-api` sin cambios conceptuales ([01-infra.md](01-infra.md)).

### → `tenant-ui` (reutilización directa, alta confianza)
- **Todo el kit de UI compartida**: `components/ui/` (`Button`, `SurfaceCard`, `InlineAlert`, `ThemeToggle`, subsistema `form/`) y `components/layout/` (`AppLayout`, `Sidebar`, `AppHeader`) — confirmado como reutilizado consistentemente en [04-frontend.md §1](04-frontend.md), sin duplicación entre módulos.
- **`lib/api-client.ts` y `lib/error-utils.ts`** — el patrón de interceptor 401 + normalización de errores es sólido y no depende de qué dominio de negocio se consuma.
- **Todos los módulos de página actuales** (`customers`, `rewards`, `transactions`, `redemptions`, `program-config`, `users`, `dashboard` con `fetchOperationalDashboardData`) — se mueven a `tenant-ui` prácticamente sin cambios, porque ya son 100% tenant-scoped.
- **`AuthContext`/`ProtectedRoute`/`role-utils`** — el flujo de sesión JWT en cliente es correcto y reutilizable tal cual para usuarios de tenant.

### Reutilizable como **patrón**, no como código (aplica a ambos)
- Estructura package-by-feature (`controller/service/repository/entity/dto` por dominio) — se replica en `platform-api` para sus propios dominios nuevos (`tenant`, `plan`, etc.).
- Convención de DTOs + Bean Validation + `GlobalExceptionHandler` — se replica igual en `platform-api`.

---

## 2. Qué necesita refactor menor

Código que funciona en su mayoría pero requiere cambios acotados antes o durante la separación:

### Backend
| Elemento | Refactor necesario | Por qué |
|---|---|---|
| `ReportServiceImpl` / `ReportController` | **Decisión de diseño, no solo fix**: la fuga cross-tenant reportada en [02-backend.md §2](02-backend.md) es exactamente la forma de un reporte de plataforma. Opción recomendada: **eliminar** `/api/reports/*` de `tenant-api` (el frontend ya no lo usa — confirmado en [04-frontend.md §2](04-frontend.md), `ReportsPage` calcula todo del lado cliente) y **reconstruir** la métrica cross-tenant como funcionalidad legítima y autorizada dentro de `platform-api`, con su propio control de acceso (`PlatformOperator`, no `ADMIN`/`STAFF` de tenant). |
| `AuthController.onboarding()` / `AuthServiceImpl.onboarding()` | Hoy crea `Tenant` + primer `AppUser` ADMIN en una sola transacción dentro del backend monolítico. Al separar, la creación del `Tenant` pasa a ser responsabilidad de `platform-api` (dueño del ciclo de vida del tenant); `tenant-api` deja de crear tenants y solo continúa creando `AppUser`s dentro de un tenant ya existente. Esto implica **partir el método**, no solo moverlo: la mitad "crear tenant" va a `platform-api`, la mitad "crear admin inicial" se dispara desde ahí hacia `tenant-api` (llamada síncrona, evento, o job) — requiere diseño de comunicación entre servicios (ver sección 4). |
| `SecurityConfig` | Se clona y se **recorta**: `tenant-api` mantiene las reglas actuales de `ADMIN`/`STAFF` menos las rutas de `/api/reports/**` y sin conocimiento de gestión de tenants; `platform-api` empieza con una `SecurityConfig` nueva pero con la misma forma (JWT stateless, reglas por rol/ruta). |
| `TenantRepository` / `Tenant` entity | Hoy vive en el backend monolítico y solo se usa desde `auth`. Pasa a ser propiedad de `platform-api`. `tenant-api` deja de tener una entidad `Tenant` completa y pasa a **solo conocer `tenant_id`** como valor de scoping (ver decisión de base de datos en sección 4) — cambio de propiedad de datos, no de lógica. |
| `CustomerTier` (umbrales hardcodeados) | Señalado en [03-logica.md §2](03-logica.md) como no configurable por tenant. No es bloqueante para la separación, pero es buen momento para moverlo a `ProgramConfig` (ya vive en `tenant-api`) ya que se está tocando ese código de todas formas. |
| `application.properties` / perfiles | Hoy hay un solo `application-dev.properties` con secretos por defecto en texto plano ([01-infra.md §2](01-infra.md)). Al crear dos servicios, cada uno necesita su propio `application-{profile}.properties` con su propio `DB_USERNAME`/`DB_PASSWORD`/`JWT_SECRET` — refactor de configuración, no de código de negocio. |

### Frontend
| Elemento | Refactor necesario | Por qué |
|---|---|---|
| `dashboard.service.ts` | Eliminar `fetchDashboardData()` (código muerto que llama al endpoint de reportes vulnerable, [04-frontend.md §2](04-frontend.md)) antes de mover el módulo a `tenant-ui`, para no arrastrar una llamada a un endpoint que ya no existirá en `tenant-api`. |
| `getCustomers()` duplicado (3 copias), `getRewardsByProgram()` duplicado (2 copias) | Consolidar en un único `customers.service.ts` / `rewards.service.ts` como parte de la mudanza a `tenant-ui` — es el momento natural para limpiar esto, ya que hay que revisar cada import de todas formas. |
| Patrón loading/error/empty repetido por página | No bloqueante, pero se recomienda extraer un hook (`useAsyncResource`) o componente `<AsyncState>` compartido **durante** la migración a `tenant-ui`, ya que cada página se va a tocar/mover igual. |
| Badges de estado (7 componentes) | Mismo caso: buen momento para evaluar una abstracción común `<StatusBadge>` mientras se mueven los módulos, sin que sea requisito duro para la separación. |
| `ModulePlaceholder.tsx` | Eliminar (código muerto, no se mueve a ningún lado). |
| `services/index.ts` | Decidir si se convierte en el barrel real de consolidación (ver duplicación arriba) o se elimina si queda vacío tras la limpieza. |

### Infraestructura
| Elemento | Refactor necesario | Por qué |
|---|---|---|
| `docker-compose.yml` | Pasa de 3 a al menos 5 servicios (`db`, `platform-api`, `tenant-api`, `platform-ui`, `tenant-ui`) — mismo patrón de red/healthcheck, pero hay que decidir enrutamiento (¿un solo nginx/gateway al frente, o cada UI habla directo con su API?). |
| Flyway | Está deshabilitado y con carpeta de migraciones vacía ([01-infra.md §2](01-infra.md)). **Debe activarse como parte de este trabajo**, no después — dos servicios escribiendo al mismo esquema con `ddl-auto=update` cada uno es una receta para migraciones en conflicto. Se recomienda activar Flyway y decidir qué servicio es dueño de qué tablas (ver sección 4). |
| Secretos en `docker-compose.yml` | Deben salir a variables de entorno/`.env` (con `.env.example` real) antes de multiplicar los servicios — hoy ya es un problema con 1 backend; con 2 backends y 2 frontends el radio de exposición se duplica. |

---

## 3. Qué se debe construir desde cero

No existe código reutilizable para esto — es trabajo nuevo:

### `platform-api`
- **`TenantController` + `TenantService`**: alta, listado, actualización, activar/desactivar (el campo `Tenant.active` ya existe en la entidad pero nunca se usa — confirmado en [02-backend.md §3](02-backend.md); aquí por fin tendría un propósito real).
- **Identidad de plataforma**: un tipo de usuario nuevo (`PlatformOperator` o similar), separado de `AppUser`, con su propio flujo de login/JWT — hoy no existe ningún concepto de usuario sin tenant.
- **Reportes cross-tenant legítimos**: reconstruir (no copiar) la funcionalidad que `ReportServiceImpl` ofrecía por accidente, ahora protegida por el rol de plataforma.
- **Gestión de planes/límites de uso**, si el negocio lo requiere (no hay nada de esto hoy en el dominio, ni siquiera parcialmente).
- **Suite de tests** desde el día uno — no hay excusa de "migrar deuda técnica" porque el código es nuevo; contrasta con la cobertura casi nula heredada del monolito ([02-backend.md §2](02-backend.md), [03-logica.md §3](03-logica.md)).

### `platform-ui`
- Aplicación nueva completa: login de operador de plataforma, listado/alta/baja de tenants, vista de métricas cross-tenant, gestión de planes si aplica.
- Puede y debe reutilizar el **kit de componentes UI** (`Button`, `SurfaceCard`, `form/*`) como dependencia compartida (ver sección 4 sobre cómo compartirlo entre `tenant-ui` y `platform-ui` sin duplicar archivos).

### Transversal a ambas APIs (deuda heredada que se vuelve bloqueante al separar)
- **Control de concurrencia** (`@Version` optimista o `@Lock` pesimista) en `Reward.stock` y `Customer.pointsBalance` — el riesgo de condición de carrera documentado en [03-logica.md §2](03-logica.md) existe hoy en el monolito; es buen momento para resolverlo mientras se reescribe/mueve `redemption`/`transaction` a `tenant-api`, antes de que haya más tráfico concurrente real.
- **Columna `created_by`/`performed_by`** en `PurchaseTransaction`, `Redemption`, `PointsMovement` — brecha de auditoría marcada como alta severidad en [03-logica.md §3](03-logica.md); construirla ahora es más barato que después de separar los servicios.
- **CI/CD**: no existe ningún pipeline hoy ([01-infra.md §3](01-infra.md)). Con 4 deployables en vez de 2, un pipeline manual deja de ser viable — se necesita al menos build+test por servicio antes de multiplicar el número de piezas a desplegar.
- **Gestión de secretos** real (Docker secrets, Vault, o al menos `.env` por servicio fuera de git) — con 4 servicios habrá más credenciales, no menos.
- **Comunicación entre `platform-api` y `tenant-api`**: no existe ningún mecanismo de comunicación entre servicios hoy (es un monolito). Hay que diseñar cómo `platform-api` provisiona un tenant nuevo en `tenant-api` (llamada REST síncrona, cola de eventos, o base de datos compartida con triggers) — ver decisión abierta en la sección 4.

---

## 4. Decisiones abiertas que bloquean el plan detallado

Estas preguntas deben resolverse antes de fijar fechas, porque cambian el orden y el tamaño de las fases:

1. **¿Base de datos compartida o separada?** Si `platform-api` y `tenant-api` comparten el mismo PostgreSQL (más simple, pero acopla despliegues y hace más difícil versionar el esquema de forma independiente) vs. bases separadas (más aislamiento, pero `tenant-api` necesita una forma de saber si un tenant está activo/suspendido sin una foreign key directa a la tabla `tenants`).
2. **¿Cómo se autentica un `PlatformOperator`?** ¿JWT con un `issuer`/`audience` distinto al de `AppUser`, un dominio de login separado, o incluso un IdP externo (recordando que [01-infra.md §3](01-infra.md) ya señaló que no hay Keycloak ni ningún IdP hoy — este podría ser el momento de introducirlo en vez de construir un segundo sistema JWT casero)?
3. **¿`platform-api` llama síncronamente a `tenant-api` para aprovisionar un tenant, o hay un paso intermedio (cola, evento)?** Afecta directamente cómo se parte `AuthServiceImpl.onboarding()` (sección 2).
4. **¿Un solo reverse proxy/gateway al frente de las 4 apps, o cada UI apunta directo a su API?** Hoy nginx en `tenant-ui` ya resuelve el proxy `/api/*` → backend interno ([01-infra.md §1](01-infra.md)); replicar ese patrón por separado para cada par UI/API es lo más simple, pero un gateway único simplificaría TLS/CORS a futuro (ninguno de los dos existe hoy).
5. **¿El kit de UI compartido se convierte en un paquete npm interno / workspace de monorepo, o se duplica entre `tenant-ui` y `platform-ui` al inicio y se consolida después?** Duplicar es más rápido para arrancar `platform-ui`; un workspace (npm/pnpm workspaces) evita la duplicación pero es trabajo de tooling adicional antes de escribir la primera pantalla.

---

## 5. Plan de fases (orden recomendado)

**Fase 0 — Decisiones y fundaciones (bloqueante, no hay código de negocio)**
- Resolver las 5 decisiones de la sección 4.
- Definir estrategia de Flyway (activarlo, decidir propietario de esquema por tabla).
- Sacar secretos de `docker-compose.yml`, crear `.env.example` real.
- Elegir estructura de repos (monorepo con 4 paquetes vs. 4 repos separados) — no auditado explícitamente pero condiciona todo lo siguiente.

**Fase 1 — `tenant-api` (reutilización dominante, riesgo bajo)**
- Mover los módulos de dominio tal cual (sección 1).
- Eliminar `/api/reports/*` de este servicio.
- Aplicar el refactor de `AuthController`/`AuthServiceImpl` para dejar de crear tenants aquí.
- Resolver control de concurrencia (`@Version`) y auditoría (`created_by`) como parte de esta migración, no después.
- Activar Flyway con las migraciones reales del esquema tenant-scoped.
- Tests de integración mínimos para los flujos de puntos/canje (inexistentes hoy, ver [03-logica.md §3](03-logica.md)) — cubrir al menos el caso de condición de carrera recién resuelto.

**Fase 2 — `tenant-ui` (reutilización dominante, riesgo bajo)**
- Mover el kit de UI compartida y todos los módulos de página.
- Limpiar duplicación de servicios (`getCustomers`, `getRewardsByProgram`) durante la mudanza.
- Apuntar `VITE_API_BASE_URL`/proxy nginx al nuevo `tenant-api`.
- Puede avanzar en paralelo a la Fase 1 una vez que el contrato de API de `tenant-api` esté congelado (mismos endpoints que hoy, menos `/api/reports/*`).

**Fase 3 — `platform-api` (construcción nueva, riesgo/esfuerzo alto)**
- Definir identidad de `PlatformOperator` (depende de la decisión 2).
- Construir `TenantController`/`TenantService` con el ciclo de vida completo del tenant.
- Reconstruir reportes cross-tenant de forma autorizada.
- Implementar el flujo de aprovisionamiento hacia `tenant-api` (depende de la decisión 3).
- Tests desde el inicio (no hay deuda que migrar aquí, así que no hay excusa para omitirlos).

**Fase 4 — `platform-ui` (construcción nueva, puede empezar en paralelo a la Fase 3 con mocks del contrato de API)**
- Login de operador, listado/gestión de tenants, vista de métricas.
- Decidir consumo del kit de UI compartido (decisión 5) antes de escribir la primera pantalla, para no duplicar trabajo.

**Fase 5 — Infraestructura y cierre**
- `docker-compose.yml` con los 5 servicios (o el gateway elegido en la decisión 4).
- CI/CD: al menos un pipeline de build+test por servicio antes de considerar el trabajo terminado — con 4 deployables, la ausencia de CI/CD deja de ser una deuda técnica tolerable y pasa a ser un riesgo operativo directo.
- Gestión de secretos real, backups de base de datos, observabilidad básica (todo lo señalado como ausente en [01-infra.md §3](01-infra.md), ahora con más urgencia por tener más piezas móviles).

---

## Resumen ejecutivo

| Categoría | % aproximado del esfuerzo total | Riesgo |
|---|---|---|
| Reutilizable tal cual (`tenant-api` dominio, `tenant-ui` UI kit y páginas) | ~45% | Bajo — es código probado, solo se reempaqueta |
| Refactor menor (reports, auth/onboarding, config, duplicación frontend) | ~20% | Medio — decisiones de diseño puntuales, alcance acotado |
| Construcción desde cero (`platform-api`, `platform-ui`, identidad de plataforma, CI/CD, migraciones reales) | ~35% | Alto — no hay precedente en el código actual; requiere las 5 decisiones de la sección 4 antes de estimar con precisión |

El activo más grande del proyecto (la lógica de fidelización y su aislamiento por tenant) se traslada con confianza alta. El trabajo nuevo y de mayor incertidumbre es enteramente el lado "platform" — que hoy no existe ni siquiera como esbozo — y la infraestructura de soporte (CI/CD, migraciones, secretos) que el proyecto nunca tuvo y que se vuelve obligatoria en cuanto hay más de un servicio desplegable.
