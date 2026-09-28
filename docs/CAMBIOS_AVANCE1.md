# Cambios del Avance 1 — SIFIPRO

> **Periodo:** 2026-09-27 · **Rama:** `feature/avance1-mejoras` · **Punto de partida:** tag `avance1-baseline` (commit `06896dd`)
> Documento de referencia: `docs/AUDITORIA_AVANCE_1.md` (estado inicial). Estado de requerimientos: `docs/MATRIZ_AVANCE.md`.

## a) Cambios respecto al estado inicial

### Bloque 1 — Seguridad crítica

| Cambio | Problema que resolvía (auditoría) |
|---|---|
| La gestión de usuarios del tenant solo asigna los roles ADMIN y STAFF (400 para PLATFORM_ADMIN). | Un ADMIN de comercio podía crear un usuario PLATFORM_ADMIN y tomar control del plano de plataforma (escalada de privilegios, B6 / D2 #1). |
| platform-api solo autentica PLATFORM_ADMIN **sin** tenant; su filtro JWT rechaza operadores inactivos o inexistentes con 401. | platform-api solo validaba el rol, no que el operador fuera de plataforma (D2 #2). |
| El login rechaza tenants suspendidos (validado después de la contraseña) y el filtro JWT deja sin autenticar las peticiones de usuarios inactivos o tenants suspendidos, con el motivo en `details`. | Suspender un tenant no tenía ningún efecto: su personal seguía entrando y los tokens de 24 h seguían valiendo (P2, D2 #3-4). |
| Un ADMIN no puede desactivarse ni quitarse el rol, y cada tenant conserva al menos un ADMIN activo. | Un tenant podía quedar sin administradores. |
| tenant-ui cierra la sesión y explica el motivo ("Session ended…") ante un 401 por suspensión o usuario inactivo. | El usuario suspendido veía errores sin explicación. |
| 14 pruebas unitarias con Mockito. | No había pruebas de las reglas de seguridad. |

### Bloque 2 — Integridad de datos y datos de demostración

| Cambio | Problema que resolvía |
|---|---|
| Migración `V3__integrity_constraints.sql`: elimina el UNIQUE global de email de clientes; CHECK de stock, saldo, montos, puntos y coherencia rol/tenant; FK de `created_by`; índices por cliente. | La BD impedía que dos comercios tuvieran al mismo cliente (contradecía la regla por tenant, B4 / D2 #24) y las reglas numéricas solo existían en la aplicación (D2 #25-27). |
| Seeder ampliado: tenant `demo` con 2 programas, 15 clientes en los 3 tiers, 8 recompensas, 62 compras en 4 meses y 15 canjes; tenant `cafe-norte` para demostrar aislamiento. | Con 3 clientes y 5 compras no se podían mostrar reportes, tiers ni aislamiento. |
| `docs/database/consultas-demo.sql` con 11 consultas de demostración. | No había forma rápida de mostrar la consistencia de la BD en la defensa. |

### Bloque 3 — Defectos de la interfaz

| Cambio | Problema que resolvía |
|---|---|
| STAFF ya no ve acciones de gestión en Clientes y Recompensas. | Los botones estaban visibles y el backend respondía 403 (D2 #38). |
| Campo de imagen con vista previa en recompensas; editar ya no borra la imagen. | Editar una recompensa desde la interfaz borraba su `imageUrl` (D2 #39). |
| Compras y canjes solo ofrecen clientes activos y recompensas canjeables; el canje muestra el saldo **en el programa** (endpoint nuevo). | La interfaz ofrecía opciones que el backend rechazaba y mostraba el saldo global, que no es el que valida el canje (D2 #40). |
| Textos del selector de programa corregidos ("on the Dashboard"). | Los textos decían "from the header", donde no hay selector (D2 #41). |
| `VITE_API_BASE_URL` unificada en Dockerfile y compose; proxy de Vite en tenant-ui. | El build usaba una variable que el código no leía; funcionaba por casualidad (D2 #50). |
| Mensaje claro para cualquier 403. | Los errores de permisos eran genéricos (D2 #45). |
| ESLint en 0 errores en ambas interfaces (antes 15 y 4). | Deuda de calidad (B12, D2 #48). |
| Se quitó la promesa de "métricas cross-tenant" del login de platform-ui. | Anunciaba una función inexistente (D2 #43). |
| El perfil muestra el tier solo con los datos del backend. | El frontend calculaba sus propios tiers (umbrales 5 000/15 000/30 000 y un nivel "Platinum" inexistente). |

### Bloque 4 — Reportes en el servidor

| Cambio | Problema que resolvía |
|---|---|
| Paquete `report/` con 7 endpoints agregados y 2 exportaciones CSV, siempre filtrados por el tenant autenticado y documentados en Swagger. | Los reportes se calculaban en el navegador descargando listas completas; los endpoints de reportes originales se habían eliminado porque mezclaban datos de todos los tenants (P14, ADR-08). |
| Página Reports reconstruida (periodos, gráficas, rankings, alertas, CSV) y Dashboard basado en los mismos endpoints. | Sin filtros por fecha ni exportación; el Dashboard descargaba todas las compras y canjes. |
| Prueba de aislamiento con Testcontainers (PostgreSQL real). | La fuga original entre tenants no tenía una prueba que impidiera su regreso. |
| Parámetros faltantes o mal formados responden 400 (antes 500). | Errores de cliente reportados como errores del servidor. |
| Etiquetas del layout según el rol ("Tenant Staff"). | El personal veía "Tenant Admin". |

### Cierre — correcciones de la revisión visual

CSV separados por `;` para Excel en español, cursor y texto de los tooltips de las gráficas acordes al tema, sin recuadro de foco al hacer clic, y tabla Top Customers sin scroll horizontal.

## b) Problemas encontrados y cómo se resolvieron

| Problema | Resolución |
|---|---|
| El ledger (`points_movements`) no tiene fecha de negocio propia: su fecha es `created_at`, siempre "ahora". Los datos de 4 meses habrían aparecido todos el mismo día. | El seeder crea todo con los servicios reales y al final alinea `created_at` con las fechas de negocio mediante SQL, solo en perfil `dev`, sin tocar montos, puntos ni stock. |
| Con el primer reparto de fechas, septiembre quedaba sin compras. | Se detectó con la consulta de compras por mes y se ajustó el reparto antes de cerrar el bloque. |
| El CHECK de coherencia rol/tenant rompía una prueba de integración existente de platform-api (creaba ADMIN sin tenant). | La prueba se adaptó para crear un tenant desechable. |
| La regla de ESLint `set-state-in-effect` marcaba 13 lugares; la corrección ingenua cambiaba el comportamiento (por ejemplo, sin skeleton al cambiar de programa). | Cargas iniciales que solo aplican resultados asíncronos (con cancelación) y reinicios durante el render, el patrón recomendado por React. |
| Con un id de cliente inválido (`NaN`), una comparación `!==` habría causado un bucle infinito de renders. | Comparación con `Object.is`. |
| En modo StrictMode, React ejecuta dos veces los inicializadores de estado y el aviso de sesión se habría leído y borrado antes de mostrarse. | Lectura idempotente y borrado posterior en un efecto. |
| Al dividir commits por cambio lógico, dos textos quedaron en el commit equivocado. | Como no había push, se reconstruyeron los últimos 6 commits y se verificó que el árbol final era idéntico y que cada commit compilaba. |
| Una prueba de aislamiento falló por una clase compilada inconsistente en `target/` tras compilaciones incrementales. | `mvn clean test`; el README recomienda siempre `clean`. |
| Los CSV se abrían en una sola columna en Excel con configuración regional en español. | Separador `;`, BOM UTF-8 y punto decimal. |

## c) Decisiones técnicas y su justificación

| Decisión | Justificación | Alternativa descartada |
|---|---|---|
| El filtro JWT consulta al usuario y a su tenant en cada petición. | Suspender un tenant o desactivar un usuario corta el acceso de inmediato, sin listas de revocación. El filtro ya consultaba la BD por petición, así que el costo es el mismo. | Tokens de vida corta con refresh token (más piezas y todavía con una ventana de minutos). |
| El estado de suspensión se revela solo después de validar la contraseña. | Quien solo conoce un email no puede saber si un comercio está suspendido. | Usar el indicador "cuenta bloqueada" de Spring, que se evalúa antes de la contraseña. |
| Restricciones duplicadas en la BD (V3), además de las validaciones de la aplicación. | La BD protege los datos aunque haya un error de código o una actualización manual. | Solo validaciones en Java. |
| Reportes con SQL agregado (`NamedParameterJdbcTemplate`) en un repositorio propio. | PostgreSQL agrega mucho más rápido que Java y no se cargan listas en memoria; el SQL explícito permite revisar el filtro por tenant línea por línea. | JPQL o cálculo en el navegador. |
| El tenant sale siempre del usuario autenticado y un programa de otro tenant responde 404. | No se revela la existencia de datos ajenos y el cliente no puede elegir el tenant. | Recibir `tenantId` como parámetro. |
| Prueba de aislamiento con Testcontainers. | Solo una BD real prueba que el SQL no mezcla tenants; se usa el esquema de Flyway y los datos del seeder. | Mocks, que no ejecutan SQL. |
| Seeder mediante los servicios de negocio. | Saldos, stock y ledger quedan consistentes por construcción. | INSERT directos en SQL. |
| Selector de programa: se corrigieron los textos en lugar de moverlo al header. | Era la opción de menor riesgo a un día de la defensa. | Rediseñar el header. |
| Saldo por programa como endpoint en el backend. | Usa exactamente el mismo cálculo que valida el canje: la interfaz no puede discrepar del servidor. | Sumar el ledger en el navegador. |
| Commits pequeños por cambio lógico y tag `avance1-baseline`. | Punto de retorno seguro y cada cambio se puede revisar o revertir por separado. | Un solo commit grande. |

## d) Pendientes para el Avance 2 y estrategia

| Pendiente | Estrategia |
|---|---|
| **RF-17** Cancelación de canjes y anulación de compras | Endpoints `PATCH …/cancel` que en una sola transacción cambien el estado a `CANCELLED` y registren movimientos compensatorios en el ledger (nunca borrar), devolviendo stock y saldo; bloqueo optimista ya existente. |
| **RF-19** Ajustes manuales y expiración de puntos | Endpoint de ajuste solo para ADMIN con motivo obligatorio (`ADJUSTMENT`); tarea programada (`@Scheduled`) que genere movimientos `EXPIRE` según una política por programa (nueva columna vía migración V4). |
| **RF-08** Cambio y recuperación de contraseña | "Cambiar mi contraseña" con la contraseña actual; recuperación con token de un solo uso y expiración, enviado por correo (servicio SMTP de desarrollo). |
| **RF-05** Edición de tenant y métricas de plataforma | `PUT /api/platform/tenants/{id}` y un endpoint de métricas agregadas por tenant en platform-api, con pantalla de detalle en platform-ui. |
| **RF-23** Búsqueda y paginación | `Pageable` y filtros en los listados de tenant-api; componente de tabla paginada compartido en las interfaces. |
| **RF-24** Bitácora administrativa | Tabla `audit_log` (migración nueva) alimentada desde los servicios de usuarios, programas, recompensas y tenants. |
| Swagger en platform-api (RNF-04) | Agregar springdoc a platform-api con las mismas anotaciones que tenant-api. |
| Pruebas (RNF-05) | Migrar las pruebas de integración antiguas a Testcontainers para que no dependan de una BD local; pruebas de componentes en el frontend (Vitest + Testing Library). |
| Integración continua (RNF-06) | Pipeline (por ejemplo GitHub Actions) que compile, ejecute ESLint y las pruebas en cada pull request, con protección de la rama `main`. |
| Deuda técnica observada | Kit de UI duplicado entre las dos interfaces (paquete compartido), código muerto identificado en la auditoría, perfil `prod` sin seeder ni `show-sql`, rotación de los secretos que quedaron en el historial de git, y tiers configurables por tenant. |
