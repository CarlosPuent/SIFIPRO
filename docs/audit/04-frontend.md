# Auditoría de Frontend — SIFIPRO

Fecha: 2026-08-29
Alcance: `sifipro-frontend/src/**` — páginas/vistas, conexión real vs. datos mock, autenticación en cliente, manejo de errores de API, estructura de componentes.
Método: revisión estática de código fuente (sin ejecutar, sin modificar nada).

---

## 1. Qué existe y funciona

### Páginas / vistas existentes (todas conectadas a la API real)
Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router 7 + Axios + Recharts + Sonner (toasts). Rutas definidas en [app/router/AppRouter.tsx](../../sifipro-frontend/src/app/router/AppRouter.tsx):

| Ruta | Página | Servicio que consume |
|---|---|---|
| `/login` | `LoginPage` | `auth.service.ts` → `POST /api/auth/login` |
| `/dashboard` | `DashboardPage` | `dashboard.service.ts` → `/api/customers`, `/api/transactions/program/{id}`, `/api/redemptions`, `/api/rewards/programs/{id}` |
| `/customers` | `CustomersPage` | `customers.service.ts` → CRUD completo `/api/customers` |
| `/customers/:id` | `CustomerProfilePage` | `customer-profile.service.ts` → `/api/customers/{id}/profile`, `/api/customers/{id}/points-history` |
| `/rewards` | `RewardsPage` | `rewards.service.ts` → CRUD completo `/api/rewards` |
| `/transactions` | `TransactionsPage` | `transactions.service.ts` → `/api/transactions`, `/api/transactions/program/{id}` |
| `/redemptions` | `RedemptionsPage` | `redemptions.service.ts` → `/api/redemptions` |
| `/reports` | `ReportsPage` | `reports.service.ts` → agrega datos de `/api/customers`, `/api/transactions/program/{id}`, `/api/redemptions`, `/api/rewards/programs/{id}` (ver nota en sección 2) |
| `/users` | `UsersPage` (solo `ADMIN`) | `users.service.ts` → CRUD completo `/api/users` |
| `/program-config` | `ProgramConfigPage` (solo `ADMIN`) | `program-config.service.ts` → CRUD completo `/api/program-config` |
| `*` | `NotFoundPage` | — |

**Todas las páginas están conectadas al backend real** vía `apiClient` (Axios). No se encontró ningún dato hardcodeado, array estático simulando respuestas, ni comentarios `TODO`/`mock`/`dummy`/`fake` en todo `src/` (búsqueda exhaustiva sin coincidencias).

### Autenticación en el cliente
[auth/AuthContext.tsx](../../sifipro-frontend/src/auth/AuthContext.tsx) implementa un flujo JWT completo y razonablemente robusto:
- Token guardado en `localStorage` (`auth.service.ts`, clave `sifipro-access-token`) y aplicado como header `Authorization: Bearer` por defecto en el cliente Axios (`setApiClientAuthToken`).
- Al montar la app, si hay token guardado, se restaura la sesión llamando a `GET /api/auth/me`; si falla, se limpia la sesión (`clearSession`) — evita quedar con un token inválido "zombie".
- Interceptor de respuesta global en [lib/api-client.ts](../../sifipro-frontend/src/lib/api-client.ts): cualquier `401` dispara los handlers registrados vía `onApiUnauthorized`, y `AuthContext` usa esto para cerrar sesión y redirigir a `/login` automáticamente ante un token expirado/inválido — mecanismo centralizado, no duplicado por página.
- [auth/ProtectedRoute.tsx](../../sifipro-frontend/src/auth/ProtectedRoute.tsx) maneja tres casos: ruta pública ya autenticado (redirige a dashboard), ruta protegida sin sesión (redirige a login), y ruta protegida con rol insuficiente (`allowedRoles`, redirige a dashboard) — usado para restringir `/users` y `/program-config` a `ADMIN` tanto a nivel de ruta como de menú lateral (`Sidebar.tsx` filtra `appNavigation` con `userHasAnyRole`).
- Estado de carga (`isLoading`) evita parpadeos de "no autenticado" mientras se restaura la sesión — se muestra un loader dedicado.

### Manejo de errores de API
Centralizado y consistente: [lib/error-utils.ts](../../sifipro-frontend/src/lib/error-utils.ts) (`extractErrorMessage`) normaliza cualquier forma de error de Axios/backend (`message`, `error`, `detail`, `details[]`, `title`, `errors{}`) a un string legible, con fallback genérico. Se usa uniformemente en **todas** las páginas para:
- Errores de carga inicial → estado de error dedicado con botón "Retry" (patrón repetido idéntico en `CustomersPage`, `DashboardPage`, `ReportsPage`, `CustomerProfilePage`, etc.).
- Errores de mutación (crear/editar/activar/desactivar) → `toast.error(...)` vía `sonner`, sin interrumpir la vista actual.

### Estructura de componentes: reutilizable, no duplicada
Buena separación en tres capas:
1. **UI primitiva compartida** ([components/ui/](../../sifipro-frontend/src/components/ui/)): `Button` (4 variantes, estado `isLoading`), `SurfaceCard`, `InlineAlert`, `ThemeToggle`, y un subsistema de formulario completo en `components/ui/form/` (`TextInput`, `TextArea`, `SelectField`, `CustomSelect`, `DateField`, `FormField`, `FormLabel`, `FormError`, `FormHint`) con estilos centralizados en `form-control-styles.ts`. Estos se reutilizan en **todos** los módulos (visto en `LoginPage`, `CustomerFormModal`, etc.).
2. **Layout compartido** ([components/layout/](../../sifipro-frontend/src/components/layout/)): `AppLayout` (shell con `Outlet` de React Router), `Sidebar` (navegación filtrada por rol), `AppHeader` — un solo lugar para el chrome de la aplicación, no duplicado por página.
3. **Componentes por módulo** (`modules/<dominio>/components/`): cada módulo de negocio tiene sus propios subcomponentes (tablas, badges de estado, modales de formulario, gráficos) acotados a ese dominio — p. ej. `CustomerStatusBadge`, `RewardStatusBadge`, `RedemptionStatusBadge`, `UserRoleBadge`/`UserStatusBadge`, todos siguiendo el mismo patrón visual de "badge" pero como componentes separados por tipo de entidad (revisar duplicación potencial en sección 2).

Cada página de listado (`CustomersPage`, `RewardsPage`, `TransactionsPage`, `RedemptionsPage`, `UsersPage`) repite el mismo patrón funcional (loading skeleton → error state con retry → empty state → tabla + modal), pero implementado como JSX propio por página en lugar de un hook/componente genérico — ver observación de duplicación en la sección 2.

### Contexto de programa (`ProgramContext`)
[modules/program-config/ProgramContext.tsx](../../sifipro-frontend/src/modules/program-config/ProgramContext.tsx) resuelve un problema real del dominio multi-programa: persiste el programa de lealtad seleccionado en `localStorage`, lo recarga al reautenticar, y expone `currentProgram`/`setCurrentProgramById` a toda la app — usado consistentemente por `DashboardPage`, `ReportsPage`, `TransactionsPage`, `RedemptionsPage` para scopear las vistas al programa activo.

---

## 2. Qué existe pero está roto o incompleto

### Código muerto: `fetchDashboardData()` nunca se usa (evita, sin saberlo, la fuga de datos del backend)
[dashboard.service.ts](../../sifipro-frontend/src/modules/dashboard/dashboard.service.ts) exporta dos funciones: `fetchDashboardData()` (llama directamente a `GET /api/reports/dashboard`, `/api/reports/top-customers`, `/api/reports/top-redeemed-rewards` — los endpoints del backend confirmados como **sin aislamiento por tenant**, ver [02-backend.md](02-backend.md)) y `fetchOperationalDashboardData()` (recalcula todo en el cliente a partir de `/api/customers`, `/api/transactions/program/{id}`, `/api/redemptions`, `/api/rewards/programs/{id}`). Solo `fetchOperationalDashboardData` está importada y usada por `DashboardPage.tsx` — `fetchDashboardData` **no se referencia en ningún otro archivo del proyecto** (confirmado por búsqueda global). Es decir:
- Existe una función completa, exportada y con tipos, que nunca se invoca — código muerto.
- Por una feliz coincidencia arquitectónica (no por decisión de seguridad explícita ni documentada), el frontend termina sin usar el endpoint vulnerable, pero eso no fue diseñado como mitigación — cualquier desarrollador podría "optimizar" el dashboard reemplazando `fetchOperationalDashboardData` por `fetchDashboardData` sin saber que reintroduce la fuga entre tenants.

### `ReportsPage` no usa `/api/reports/*` en absoluto — reimplementa agregación en el cliente
[reports.service.ts](../../sifipro-frontend/src/modules/reports/reports.service.ts) (`getReportsData`) ignora por completo los endpoints de reportes del backend y reconstruye manualmente, en el navegador: conteo de clientes activos, top 10 clientes por actividad, top 10 recompensas más canjeadas, y totales de puntos emitidos/canjeados — todo a partir de listas completas de `/api/customers`, `/api/transactions/program/{id}`, `/api/redemptions`, `/api/rewards/programs/{id}` traídas íntegras al cliente. Esto:
- Descarga al navegador **todas** las transacciones y canjes del programa (sin paginación) solo para calcular agregados — no escala bien y duplica lógica de negocio (ranking, sumas) que ya existe (aunque rota) en el backend.
- Filtra redenciones por `programConfigId` en el cliente (`filterRedemptionsByProgram`) porque `GET /api/redemptions` del backend no acepta ese filtro — trabajo que debería hacer el servidor.
- Es, en la práctica, el reemplazo funcional correcto del endpoint roto de reportes, pero como solución no declarada ni documentada — un desarrollador que revise solo el backend concluiría que "los reportes están rotos"; solo mirando el frontend se descubre que la funcionalidad de negocio sí existe, reimplementada del lado del cliente.

### Duplicación de servicios: `getCustomers()` repetido en tres módulos
`customers.service.ts`, `redemptions.service.ts` y `transactions.service.ts` cada uno define y exporta su **propia copia** de `getCustomers()` (idéntica: `GET /api/customers`, misma normalización `Array.isArray(...)`). No hay un único punto de verdad para "obtener clientes" — tres implementaciones idénticas mantenidas por separado. Mismo patrón con `getRewardsByProgram()`, duplicado entre `rewards.service.ts` y `redemptions.service.ts`. El archivo [services/index.ts](../../sifipro-frontend/src/services/index.ts) existe (sugiriendo la intención de un barrel central) pero está vacío/sin uso real de consolidación — revisar su contenido no resolvió la duplicación.

### Patrón loading/error/empty duplicado por página en vez de un hook compartido
Cada página de listado (`CustomersPage`, `RewardsPage`, `TransactionsPage`, `RedemptionsPage`, `UsersPage`, `ReportsPage`, `DashboardPage`) reimplementa manualmente el mismo trío de estados (`isLoading`, `loadError`, estado vacío) con componentes locales `XxxLoadingState`/`XxxErrorState`/`XxxEmptyState` casi idénticos entre sí (mismo layout de esqueletos `animate-pulse`, misma tarjeta de error con botón "Retry"). No hay un hook genérico (`useAsyncResource`, `useQuery`-like) ni un componente `<AsyncState>` compartido — es duplicación de patrón, no de UI atómica (los átomos como `Button`/`SurfaceCard` sí se reutilizan correctamente).

### Badges de estado — patrón repetido por entidad sin abstracción común
`CustomerStatusBadge`, `RewardStatusBadge`, `RedemptionStatusBadge`, `UserStatusBadge`, `UserRoleBadge`, `MovementTypeBadge`, `ProgramStatusBadge` son siete componentes distintos que, con alta probabilidad, renderizan la misma estructura visual (píldora de color según estado) con distinto mapeo de texto/color por dominio. No se confirmó una abstracción común tipo `<StatusBadge tone="..." label="..." />` reutilizada por todos — cada módulo definió el suyo. Riesgo de mantenimiento: un cambio de estilo de badges requeriría tocar siete archivos.

### Token JWT en `localStorage` (no `httpOnly` cookie)
El access token se guarda en `localStorage` ([auth.service.ts](../../sifipro-frontend/src/auth/auth.service.ts)), accesible por cualquier script que se ejecute en la página. Es el patrón más común en SPAs y funciona correctamente, pero implica que un XSS exitoso en cualquier punto de la aplicación (por ejemplo, vía un campo de texto libre mal saneado, como `Reward.description` o `Redemption.notes`, que se muestran sin sanitizar explícita) podría exfiltrar el token de sesión. No se encontró uso de `dangerouslySetInnerHTML` en el código revisado, lo que mitiga parcialmente el riesgo, pero la elección de almacenamiento en sí es una superficie de ataque conocida.

### `ModulePlaceholder.tsx` es código muerto
[components/ui/ModulePlaceholder.tsx](../../sifipro-frontend/src/components/ui/ModulePlaceholder.tsx) existe (un placeholder genérico "This area is intentionally kept simple for the MVP stage") pero **no está importado por ningún archivo del proyecto** — probablemente un remanente de un scaffold inicial de módulos antes de que se implementaran las páginas reales; ya no cumple ninguna función.

---

## 3. Qué falta por completo

### No hay manejo de expiración de token vía refresh
No existe ningún mecanismo de refresh token ni de renovación silenciosa de sesión — el JWT del backend expira en 24h (`app.auth.jwt.expiration-ms=86400000`, ver auditoría de backend) y, al expirar, el único comportamiento es el interceptor de `401` cerrando sesión y mandando a login. No hay aviso previo al usuario ("tu sesión expirará pronto") ni renovación transparente.

### No hay tests de frontend
No se encontró ningún archivo de test (`*.test.tsx`, `*.spec.tsx`), ni configuración de un test runner (Vitest, Jest, Testing Library) en `package.json` — cero cobertura de pruebas automatizadas en el cliente, consistente con la falta de tests observada también en el backend.

### No hay manejo de estado de "modo offline" / reintentos automáticos
`apiClient` tiene un `timeout: 10000` fijo pero no hay lógica de reintento automático (retry con backoff) ante fallos de red transitorios — cada fallo requiere que el usuario pulse "Retry" manualmente.

### No hay paginación en ninguna lista
Todas las llamadas de listado (`getCustomers`, `getAllRewards`, `getAllTransactions`, `getAllRedemptions`, `getUsers`) traen el dataset completo sin parámros de paginación, y el backend tampoco expone ninguno (confirmado en la auditoría de backend). Para un tenant con miles de clientes/transacciones, tanto el tiempo de carga como el cálculo de reportes en el cliente (sección 2) se degradarían significativamente. No hay indicios de virtualización de listas tampoco.

### No hay internacionalización (i18n)
Todo el texto de la interfaz está hardcodeado en inglés directamente en el JSX (sin `react-i18next` ni ninguna capa de traducción), pese a que el dominio de negocio (nombres de clientes demo, README) sugiere un mercado hispanohablante (El Salvador, según los teléfonos `+503` del seeder). No hay forma de localizar la UI sin modificar cada componente.

### No hay manejo de permisos granular más allá de rutas
El control de acceso por rol solo existe a nivel de **ruta** (`ProtectedRoute allowedRoles`) y de **visibilidad de menú** (`Sidebar` filtra ítems). Dentro de una misma página no hay ocultamiento/deshabilitación condicional de acciones según rol — por ejemplo, en el backend `STAFF` no puede crear/editar/activar recompensas (solo `ADMIN` puede, ver auditoría de backend), pero `RewardsPage`/`RewardFormModal` no fueron verificados exhaustivamente para confirmar si ocultan esos botones a `STAFF` o si el usuario los ve habilitados y solo descubre la restricción al recibir un `403` del backend — este último caso sería una UX incompleta, no un bug de seguridad (el backend sí protege), pero afecta la experiencia.

### No hay manejo específico de errores `403 Forbidden`
El interceptor global de `api-client.ts` solo reacciona a `401` (sesión inválida/expirada). Un `403` (autenticado pero sin permiso, p. ej. `STAFF` intentando una acción solo-`ADMIN`) cae en el manejo genérico de `extractErrorMessage` en cada página, mostrando el mensaje crudo del backend en un toast, sin ningún tratamiento diferenciado ni redirección.
