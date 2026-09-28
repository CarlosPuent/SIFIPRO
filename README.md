# SIFIPRO — Sistema de Fidelización Profesional

Plataforma SaaS multi-tenant para la gestión de programas de lealtad, puntos y recompensas en comercios y empresas de servicios. Permite a distintos negocios administrar clientes, registrar compras, acumular puntos automáticamente, procesar canjes de recompensas y consultar reportes desde una interfaz web centralizada.

El sistema está dividido en dos planos independientes:

- **Plano de tenant** (`sifipro-backend` + `sifipro-frontend`): la operación diaria de un comercio — clientes, compras, recompensas, canjes, reportes y usuarios internos.
- **Plano de plataforma** (`sifipro-platform-api` + `sifipro-platform-ui`): la administración de tenants por el equipo de SIFIPRO — alta con su primer ADMIN, listado, activación y suspensión de comercios.

Ambos planos comparten una única base de datos PostgreSQL, pero **solo `sifipro-backend` gestiona el esquema** (vía Flyway); `sifipro-platform-api` únicamente lee/escribe sobre las tablas compartidas (`tenants`, `app_users`) sin nunca crearlas ni migrarlas.

---

## Contenido

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Inicio rápido con Docker](#inicio-rápido-con-docker)
- [Credenciales y datos demo](#credenciales-y-datos-demo)
- [Flujo de prueba end-to-end](#flujo-de-prueba-end-to-end)
- [Reportes](#reportes)
- [Pruebas automatizadas](#pruebas-automatizadas)
- [Desarrollo local sin Docker](#desarrollo-local-sin-docker)
- [Variables de entorno](#variables-de-entorno)
- [Documentación de la API](#documentación-de-la-api)
- [Módulos del sistema](#módulos-del-sistema)
- [Seguridad](#seguridad)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Notas técnicas](#notas-técnicas)
- [Documentación adicional](#documentación-adicional)

---

## Arquitectura

SIFIPRO son cuatro servicios más una base de datos compartida:

```
Comercio (tenant)                              Equipo de plataforma SIFIPRO
        |                                                |
        v                                                v
tenant-ui (puerto 5173)                       platform-ui (puerto 5174)
nginx + React                                 nginx + React
  |-- /       → app React (estáticos)           |-- /       → app React (estáticos)
  |-- /api/*  → proxy a tenant-api               |-- /api/*  → proxy a platform-api
        |                                                |
        v                                                v
tenant-api (puerto interno 8081)              platform-api (puerto interno 8082)
Spring Boot — ADMIN / STAFF de un tenant      Spring Boot — PLATFORM_ADMIN
Dueño único del esquema (Flyway)              Nunca crea ni migra el esquema (ddl-auto=none)
        |                                                |
        +--------------------+     +---------------------+
                             v     v
                    PostgreSQL (puerto interno 5432)
                    base de datos compartida: sifipro_db
```

Ningún frontend hace llamadas cross-origin: nginx intercepta `/api/*` y lo redirige internamente al backend correspondiente dentro de la red Docker privada, eliminando la necesidad de configuración CORS en producción.

**Tenant-api / tenant-ui** — lo que usa el personal de un comercio día a día: registrar clientes, compras y canjes, gestionar el catálogo de recompensas y los programas de lealtad, y consultar reportes. La arquitectura multi-tenant es de **base de datos y esquema compartidos**: cada tabla de negocio tiene `tenant_id` y cada consulta filtra por el tenant del usuario autenticado. Ese tenant se obtiene en cada petición cargando al usuario desde la base de datos a partir del `sub` (email) del JWT; el token también incluye `tenantId`/`tenantCode` como información, pero el backend **no confía en esos claims** para filtrar. El cliente nunca envía el tenant.

**Platform-api / platform-ui** — lo que usa el equipo de SIFIPRO para administrar el negocio como plataforma SaaS: crear tenants nuevos (junto con su primer usuario ADMIN), listarlos y activar/suspender su acceso. Se autentica con un rol distinto (`PLATFORM_ADMIN`) y un JWT firmado con un secreto completamente separado (`PLATFORM_JWT_SECRET`) — un token de un plano nunca es válido en el otro.

---

## Tecnologías

**tenant-api** (`sifipro-backend`) y **platform-api** (`sifipro-platform-api`)

- Java 17 / Spring Boot 4.0.5
- Spring Security con autenticación JWT HS512 (jjwt 0.12.6, secretos de firma independientes por servicio)
- Spring Data JPA / Hibernate; consultas agregadas de reportes con `NamedParameterJdbcTemplate`
- PostgreSQL 16
- Maven (wrapper incluido)
- Flyway (solo en tenant-api — es el único dueño del esquema compartido)
- springdoc-openapi 3.0.3 (Swagger UI en tenant-api)
- JUnit 5, Mockito y Testcontainers 2.0 para las pruebas

**tenant-ui** (`sifipro-frontend`) y **platform-ui** (`sifipro-platform-ui`)

- React 19 con TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Axios
- Recharts (gráficas de Dashboard, perfil de cliente y Reportes)
- Sonner (notificaciones)

**Infraestructura**

- Docker y Docker Compose
- nginx (Alpine) sirviendo ambos frontends y proxeando `/api/*`
- Eclipse Temurin JDK/JRE 17 (Alpine) para ambos backends (build multi-stage, usuario no-root)
- Node 22 (Alpine) como etapa de build de ambos frontends

---

## Estructura del proyecto

```
SIFIPRO/
├── docker-compose.yml           Orquestación de los 5 contenedores (db + 4 servicios)
├── .env.example                 Plantilla de variables de entorno
├── README.md
├── docs/                        Auditoría, matriz de avance, cambios y consultas SQL de demo
│
├── sifipro-backend/             tenant-api — Spring Boot, dueño único del esquema
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/puent/sifipro/
│       │   ├── auth/            Autenticación JWT de tenant (login, /me, filtro JWT)
│       │   ├── config/          Seguridad, CORS, OpenAPI y seeder de datos de dev
│       │   ├── customer/        Clientes, perfil 360° y tiers
│       │   ├── loyalty/         Programas de fidelización
│       │   ├── redemption/      Canjes de recompensas y saldo por programa
│       │   ├── report/          Reportes agregados y exportación CSV
│       │   ├── reward/          Catálogo de recompensas
│       │   ├── tenant/          Entidad Tenant (el ciclo de vida lo administra platform-api)
│       │   ├── transaction/     Compras y ledger de movimientos de puntos
│       │   └── user/            Usuarios internos (ADMIN/STAFF)
│       ├── main/resources/
│       │   ├── application.properties
│       │   ├── application-dev.properties
│       │   └── db/migration/    Migraciones Flyway V1, V2 y V3
│       └── test/                Tests unitarios y de integración
│
├── sifipro-frontend/            tenant-ui — React, operación diaria del comercio
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts           Incluye proxy /api → localhost:8081 para desarrollo
│   └── src/
│       ├── auth/                Contexto de autenticación y guards
│       ├── modules/             Módulos por dominio (customers, rewards, transactions, reports, ...)
│       ├── components/          Componentes compartidos y layout
│       └── lib/                 Cliente HTTP y utilidades
│
├── sifipro-platform-api/        platform-api — Spring Boot, administración de tenants
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/puent/sifipro/platform/
│       │   ├── auth/            Login de PLATFORM_ADMIN (JWT propio, secreto propio)
│       │   ├── tenant/          Alta, listado y activar/desactivar tenants
│       │   └── user/            Mapeo sobre la tabla compartida app_users
│       └── resources/
│           └── application.properties   (ddl-auto=none, sin Flyway — nunca toca el esquema)
│
└── sifipro-platform-ui/         platform-ui — React, panel del equipo de plataforma
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── auth/                Contexto de autenticación (token propio, distinto al de tenant-ui)
        ├── modules/tenants/     Pantalla de gestión de tenants
        ├── components/          Componentes compartidos y layout
        └── lib/                 Cliente HTTP y utilidades
```

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.0 o superior
- Navegador web moderno (Chrome 100+, Firefox 100+, Edge 100+)

No se requiere instalar Java, Node.js, Maven ni PostgreSQL para ejecutar el sistema: todo corre dentro de los contenedores. Para ejecutar las pruebas automatizadas en la máquina local se necesita Java 17+ y Docker (ver [Pruebas automatizadas](#pruebas-automatizadas)).

---

## Inicio rápido con Docker

**1. Clonar o descomprimir el proyecto**

```bash
git clone <url-del-repositorio>
cd SIFIPRO
```

**2. Configurar variables de entorno**

```bash
cp .env.example .env
```

Edita `.env` y completa `POSTGRES_PASSWORD`, `DB_USERNAME`, `DB_PASSWORD`, `APP_JWT_SECRET` y
`PLATFORM_JWT_SECRET` con valores reales (no uses los placeholders de ejemplo). `APP_JWT_SECRET`
y `PLATFORM_JWT_SECRET` deben ser **valores distintos entre sí** — cada uno firma los tokens de
un servicio distinto. `.env` está excluido de git — nunca lo subas al repositorio.

**3. Levantar todos los servicios**

```bash
docker compose up --build
```

Docker construirá las cuatro imágenes de aplicación, descargará la imagen de PostgreSQL y
levantará los cinco contenedores. El proceso completo toma varios minutos la primera vez; las
ejecuciones posteriores son significativamente más rápidas gracias al caché de capas.

**4. Esperar a que el sistema esté listo**

`tenant-api` imprime un mensaje propio cuando termina de arrancar (incluye aplicar las
migraciones Flyway y sembrar los datos de demo):

```
sifipro-backend | Sifipro Backend Application is running...
```

Para confirmar que los cinco contenedores están arriba:

```bash
docker compose ps
```

**5. Abrir el sistema**

| Servicio       | URL                   | Qué es                                                        |
| -------------- | --------------------- | ------------------------------------------------------------- |
| `tenant-ui`    | http://localhost:5173 | Panel operativo del comercio (clientes, recompensas, canjes…) |
| `platform-ui`  | http://localhost:5174 | Panel del equipo de plataforma (gestión de tenants)           |
| `tenant-api`   | http://localhost:8085 | API REST de tenant, expuesta solo para debug/Swagger          |
| `platform-api` | http://localhost:8086 | API REST de plataforma, expuesta solo para debug              |

Para detener todos los servicios:

```bash
docker compose down
```

Para **borrar los datos y volver a sembrar la demo desde cero** (el sembrado solo ocurre sobre
una base vacía):

```bash
docker compose down -v
docker compose up --build -d
```

---

## Credenciales y datos demo

En el perfil `dev` (el único perfil que existe y el que usa Docker), `DevDataSeederConfig`
siembra la base cuando está vacía. El sembrado es idempotente por código de tenant: un tenant
que ya existe no se vuelve a sembrar.

| Rol                    | Correo                     | Contraseña        | Se usa en     | Tenant                     |
| ---------------------- | -------------------------- | ----------------- | ------------- | -------------------------- |
| Operador de plataforma | platform-admin@sifipro.com | PlatformAdmin123! | `platform-ui` | — (sin tenant)             |
| Administrador          | admin@sifipro.com          | Admin123!         | `tenant-ui`   | `demo` (Demo Tenant)       |
| Personal operativo     | staff@sifipro.com          | Staff123!         | `tenant-ui`   | `demo` (Demo Tenant)       |
| Administrador          | admin@cafenorte.com        | Admin123!         | `tenant-ui`   | `cafe-norte` (Café del Norte) |

**Tenant `demo`** — pensado para mostrar reportes con datos realistas:

- 2 programas: *SIFIPRO Rewards* (1.5 pts/$, compra mínima $25) y *Club Café* (2 pts/$, mínima $10).
- 15 clientes repartidos en los tres tiers: 3 GOLD, 5 SILVER y 7 BRONZE (uno inactivo).
- 8 recompensas, con una agotada (*Audífonos inalámbricos*) y dos con stock bajo.
- 62 compras distribuidas en los últimos cuatro meses (algunas bajo la compra mínima, con 0 puntos) y 15 canjes recientes.

**Tenant `cafe-norte`** — tenant pequeño para demostrar el aislamiento: 1 programa, 4 clientes,
3 recompensas, 10 compras y 2 canjes. Comparte a propósito un cliente con `demo`
(`laura.mendoza@sifipro.dev`): cada tenant tiene su propio registro y su propio saldo.

Todas las compras y canjes se crean mediante los servicios de negocio reales, así que saldos,
stock y ledger son consistentes (el saldo de cada cliente coincide con la suma de sus
movimientos). Las fechas de auditoría se alinean con las fechas de negocio para que las gráficas
muestren la actividad repartida en el tiempo.

Permisos por rol:

- **ADMIN**: acceso a todos los módulos de su tenant, incluidos usuarios internos y programas.
- **STAFF**: consulta todos los módulos operativos y reportes; **crea** clientes, compras y canjes; no puede editar/activar/desactivar clientes, gestionar recompensas, programas ni usuarios (la interfaz oculta esas acciones y la API responde 403).
- **PLATFORM_ADMIN**: solo existe en `platform-ui`. No puede iniciar sesión en `tenant-ui` porque tenant-api exige que el usuario pertenezca a un tenant.

---

## Flujo de prueba end-to-end

Esta prueba demuestra que la separación entre plataforma y tenant funciona de verdad:

1. Abre `platform-ui` (http://localhost:5174) e inicia sesión con
   `platform-admin@sifipro.com` / `PlatformAdmin123!`.
2. En la pantalla **Tenants**, pulsa **New Tenant** y completa el formulario: nombre y código del
   tenant, más nombre, apellido, email y contraseña de su primer usuario ADMIN.
3. Al crearse, el tenant aparece en la tabla con estado **Active**.
4. Abre `tenant-ui` (http://localhost:5173, en otra ventana o en modo incógnito) e inicia sesión
   con el ADMIN que acabas de crear — funciona de inmediato. El tenant nuevo no tiene programas:
   crea uno en **Programs**, selecciónalo en el **Dashboard** y registra clientes, recompensas,
   compras y canjes. Ningún dato de los tenants demo es visible.
5. **Suspensión:** con la sesión del nuevo ADMIN abierta, pulsa **Deactivate** en `platform-ui`.
   En la siguiente acción, `tenant-ui` cierra la sesión y el login muestra *"Your organization's
   account has been suspended…"*; un nuevo login responde *"Tenant account is suspended."*.
   Los tokens ya emitidos dejan de servir de inmediato.
6. Pulsa **Activate** y el ADMIN vuelve a operar con normalidad.

---

## Reportes

La página **Reports** de `tenant-ui` y el **Dashboard** leen datos agregados que calcula
tenant-api con consultas `COUNT`/`SUM`/`GROUP BY` en PostgreSQL. Todos los endpoints filtran
siempre por el tenant del usuario autenticado; un `programConfigId` de otro tenant responde 404.

| Método | Ruta                                  | Qué devuelve                                                        |
| ------ | ------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/reports/summary`                | Compras, monto, puntos emitidos y canjeados, canjes, clientes       |
| GET    | `/api/reports/timeseries`             | Serie por día o mes (`granularity=DAY\|MONTH`), con ceros sin actividad |
| GET    | `/api/reports/top-customers`          | Clientes ordenados por puntos ganados                               |
| GET    | `/api/reports/top-rewards`            | Recompensas más canjeadas                                           |
| GET    | `/api/reports/tier-distribution`      | Clientes por tier (todo el tenant, según saldo actual)              |
| GET    | `/api/reports/stock-alerts`           | Recompensas activas con stock bajo o agotado                        |
| GET    | `/api/reports/recent-activity`        | Últimas compras y canjes (Dashboard)                                |
| GET    | `/api/reports/export/summary.csv`     | Resumen en CSV                                                      |
| GET    | `/api/reports/export/purchases.csv`   | Compras del periodo en CSV (streaming)                              |

Parámetros comunes: `programConfigId` (obligatorio salvo en `tier-distribution`), `from` y `to`
(opcionales, `yyyy-MM-dd`, inclusivos). Acceso: ADMIN y STAFF.

Los CSV usan **`;` como separador** (así los abre Excel con configuración regional en español),
punto decimal y UTF-8 con BOM; los valores de texto que empiezan con `=`, `+`, `-` o `@` se
neutralizan para evitar inyección de fórmulas.

---

## Pruebas automatizadas

Pruebas que **no** necesitan la base de datos de desarrollo (recomendado; usar `clean` evita
clases compiladas desactualizadas):

```bash
# tenant-api: unitarias (Mockito) + aislamiento de reportes con Testcontainers
cd sifipro-backend
./mvnw clean test -Dtest='!SifiproBackendApplicationTests,!RedemptionConcurrencyIntegrationTest' -Dsurefire.failIfNoSpecifiedTests=false

# platform-api: unitarias
cd sifipro-platform-api
./mvnw clean test -Dtest=CustomUserDetailsServiceTest
```

| Proyecto     | Clase                                  | Tipo                       | Qué demuestra                                                              |
| ------------ | -------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| tenant-api   | `UserServiceImplTest`                  | Unitaria                   | Rol PLATFORM_ADMIN rechazado; un ADMIN no se desactiva ni se degrada; siempre queda un ADMIN activo |
| tenant-api   | `AuthServiceImplTest`                  | Unitaria                   | Login rechazado con tenant suspendido                                      |
| tenant-api   | `JwtAuthenticationFilterTest`          | Unitaria                   | Un token ya emitido deja de valer si el usuario o el tenant se desactivan  |
| tenant-api   | `RedemptionServiceImplTest`            | Unitaria                   | Saldo canjeable por programa; programa de otro tenant → 404                |
| tenant-api   | `CsvWriterTest`                        | Unitaria                   | Separador `;`, comillas e inyección de fórmulas                            |
| tenant-api   | `ReportTenantIsolationIntegrationTest` | Integración (Testcontainers) | Un tenant no ve datos de otro en ningún reporte ni en el CSV             |
| platform-api | `CustomUserDetailsServiceTest`         | Unitaria                   | Solo PLATFORM_ADMIN sin tenant puede autenticarse                          |

`ReportTenantIsolationIntegrationTest` levanta un PostgreSQL 16 desechable en Docker (requiere
Docker Desktop encendido), aplica las migraciones reales y usa los tenants que siembra el seeder.

Las pruebas de integración más antiguas (`SifiproBackendApplicationTests`,
`RedemptionConcurrencyIntegrationTest` y las de platform-api `AuthControllerIntegrationTest`,
`TenantControllerIntegrationTest`, `SifiproPlatformApiApplicationTests`) se conectan a una base
PostgreSQL local en `localhost:5432` y escriben datos; Docker Compose no publica ese puerto, así
que solo corren en un entorno de desarrollo sin Docker.

Frontends: `npm run build` (incluye chequeo de TypeScript) y `npx eslint .` en cada UI.

---

## Desarrollo local sin Docker

Para ejecutar el proyecto en modo desarrollo sin contenedores, cada componente debe iniciarse por
separado. Necesitas correr **al menos tenant-api + tenant-ui**, o **al menos platform-api +
platform-ui**, según qué plano quieras probar — ambos requieren la misma base de datos
PostgreSQL local.

**Requisitos adicionales para desarrollo local**

- Java 17 (OpenJDK o Oracle JDK)
- Maven 3.8+ (o el wrapper `./mvnw` incluido)
- Node.js 22+ con npm
- PostgreSQL 14+ corriendo localmente

**tenant-api** (`sifipro-backend`)

```bash
cd sifipro-backend

# No hay valores por defecto embebidos: DB_USERNAME, DB_PASSWORD y APP_JWT_SECRET
# deben existir como variables de entorno o el arranque falla.
export DB_USERNAME=sifipro
export DB_PASSWORD=tu_contraseña
export APP_JWT_SECRET=$(openssl rand -base64 48)

./mvnw spring-boot:run
```

El servidor inicia en `http://localhost:8081` y aplica las migraciones Flyway pendientes contra
tu PostgreSQL local automáticamente.

**tenant-ui** (`sifipro-frontend`)

```bash
cd sifipro-frontend

npm install
npm run dev
```

La aplicación abre en `http://localhost:5173`. No requiere configurar ningún `.env`:
`vite.config.ts` incluye un proxy de desarrollo de `/api` hacia `http://localhost:8081`, el
mismo mecanismo que usa nginx en Docker. Si defines `VITE_API_BASE_URL` en
`sifipro-frontend/.env`, el frontend llamará a esa URL directamente (requiere CORS).

**platform-api** (`sifipro-platform-api`)

```bash
cd sifipro-platform-api

# Mismas credenciales de base de datos que tenant-api (comparten la misma base),
# más un secreto de JWT propio y distinto de APP_JWT_SECRET.
export DB_USERNAME=sifipro
export DB_PASSWORD=tu_contraseña
export PLATFORM_JWT_SECRET=$(openssl rand -base64 48)

./mvnw spring-boot:run
```

El servidor inicia en `http://localhost:8082`. No aplica ninguna migración — requiere que
tenant-api ya haya corrido al menos una vez contra esa base para que el esquema exista.

**platform-ui** (`sifipro-platform-ui`)

```bash
cd sifipro-platform-ui

npm install
npm run dev
```

La aplicación abre en `http://localhost:5174`. Igual que tenant-ui, `vite.config.ts` incluye un
proxy de desarrollo hacia `http://localhost:8082`.

---

## Variables de entorno

**Backends (definidas en `.env` en la raíz del repo, ver `.env.example`)**

Ninguna tiene un valor por defecto embebido en el código: si falta alguna, el arranque del
servicio correspondiente falla en vez de usar un secreto de ejemplo silenciosamente.

| Variable                 | Descripción                                                                              | Usada por                              |
| ------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| `POSTGRES_PASSWORD`      | Password de inicialización del contenedor `db`                                           | `db`                                   |
| `DB_USERNAME`            | Usuario/rol de Postgres, compartido por ambos backends                                   | `db`, `tenant-api`, `platform-api`     |
| `DB_PASSWORD`            | Contraseña de `DB_USERNAME`                                                              | `db`, `tenant-api`, `platform-api`     |
| `APP_JWT_SECRET`         | Clave para firmar tokens JWT de tenant-api                                               | `tenant-api`                           |
| `PLATFORM_JWT_SECRET`    | Clave para firmar tokens JWT de platform-api — **debe ser distinta de `APP_JWT_SECRET`** | `platform-api`                         |
| `SPRING_DATASOURCE_URL`  | URL de conexión a PostgreSQL (misma base para ambos backends)                            | ambos (`jdbc:postgresql://db:5432/sifipro_db` en Docker) |
| `SPRING_PROFILES_ACTIVE` | Perfil de Spring. Solo existe el perfil `dev` (incluye el seeder de datos demo)          | `tenant-api` (`dev` en Docker)         |

**Frontends (build argument en Docker)**

| Variable            | Servicio      | Valor en Docker                             |
| ------------------- | ------------- | ------------------------------------------- |
| `VITE_API_BASE_URL` | `tenant-ui`   | `""` (relativo, proxy nginx a tenant-api)   |
| `VITE_API_BASE_URL` | `platform-ui` | `""` (relativo, proxy nginx a platform-api) |

---

## Documentación de la API

Con el sistema corriendo, la documentación interactiva de **tenant-api** (incluidos los
reportes) está disponible en:

```
http://localhost:8085/swagger-ui.html
```

La especificación OpenAPI en formato JSON está en:

```
http://localhost:8085/v3/api-docs
```

`platform-api` no expone Swagger/OpenAPI en esta etapa del proyecto; sus endpoints están listados
en [Módulos del sistema](#módulos-del-sistema).

Todos los endpoints protegidos (en ambos servicios) requieren un token JWT en el encabezado
`Authorization: Bearer <token>`, obtenido desde el endpoint de login correspondiente. Un token de
`tenant-api` nunca es válido en `platform-api`, ni viceversa (secretos de firma distintos).

---

## Módulos del sistema

**tenant-api** (`sifipro-backend`, base `/api`)

| Módulo               | Endpoint base         | Roles con acceso                                                   |
| -------------------- | --------------------- | ------------------------------------------------------------------ |
| Autenticación        | `/api/auth`           | Público (login) / autenticado (`/me`)                              |
| Clientes             | `/api/customers`      | ADMIN, STAFF (consultar y crear); ADMIN (editar, activar, desactivar) |
| Programas de lealtad | `/api/program-config` | ADMIN (consulta también STAFF)                                     |
| Recompensas          | `/api/rewards`        | ADMIN, STAFF (consulta); ADMIN (alta, edición, activación)         |
| Compras y ledger     | `/api/transactions`   | ADMIN, STAFF (consultar y registrar)                               |
| Canjes               | `/api/redemptions`    | ADMIN, STAFF (consultar, registrar y saldo por programa)           |
| Reportes             | `/api/reports`        | ADMIN, STAFF (solo lectura)                                        |
| Usuarios internos    | `/api/users`          | ADMIN                                                              |
| Health check         | `/api/health`, `/actuator/health` | Público                                                |

**platform-api** (`sifipro-platform-api`, base `/api/platform`)

| Módulo        | Endpoint base                              | Roles con acceso                         |
| ------------- | ------------------------------------------ | ---------------------------------------- |
| Autenticación | `/api/platform/auth`                       | Público (login) / PLATFORM_ADMIN (`/me`) |
| Tenants       | `/api/platform/tenants`                    | PLATFORM_ADMIN                           |
| Health check  | `/api/platform/health`, `/actuator/health` | Público                                  |

---

## Seguridad

- **JWT por plano**: HS512, 24 h de vigencia, secretos distintos por servicio. El rechazo cruzado
  está verificado (un token de un plano responde 401 en el otro).
- **Validación por petición**: en cada request, tenant-api carga al usuario y a su tenant. Si el
  usuario está inactivo o el tenant suspendido, responde 401 con el motivo en `details`
  (`USER_INACTIVE` o `TENANT_SUSPENDED`), así que desactivar un usuario o suspender un tenant
  corta el acceso de inmediato, incluso con tokens ya emitidos.
- **Roles**: la gestión de usuarios de un tenant solo asigna `ADMIN` o `STAFF`; platform-api solo
  autentica `PLATFORM_ADMIN` sin tenant; la base de datos refuerza esa regla con un CHECK (V3).
  Un ADMIN no puede desactivarse ni quitarse el rol, y cada tenant conserva al menos un ADMIN activo.
- **Contraseñas** con BCrypt; el estado de suspensión solo se revela después de validar la contraseña.
- **Aislamiento multi-tenant** en cada consulta (incluidos los reportes), cubierto por una prueba de
  integración con PostgreSQL real.

---

## Base de datos y migraciones

El esquema lo gestiona Flyway desde tenant-api (`sifipro-backend/src/main/resources/db/migration/`),
con `ddl-auto=validate`:

| Versión | Archivo                             | Qué hace                                                                 |
| ------- | ----------------------------------- | ------------------------------------------------------------------------ |
| V1      | `V1__baseline_schema.sql`           | Esquema base (tablas, índices y FKs) tal como existía antes de Flyway    |
| V2      | `V2__platform_operator_support.sql` | `tenant_id` nullable y rol `PLATFORM_ADMIN` en `app_users`               |
| V3      | `V3__integrity_constraints.sql`     | Email de cliente único por tenant (elimina el UNIQUE global); CHECK de stock ≥ 0, saldo ≥ 0, monto > 0, puntos por dólar > 0, compra mínima ≥ 0, puntos requeridos > 0 y coherencia rol/tenant; FK de `created_by`; índices por `customer_id` |

Nunca se editan migraciones existentes: cada cambio de esquema es una migración nueva.
`docs/database/consultas-demo.sql` contiene consultas de solo lectura para la demo (saldo vs
ledger, compras por mes, aislamiento por tenant, constraints, historial de Flyway).

---

## Notas técnicas

- `tenant-api` y `platform-api` firman sus JWT con secretos distintos (`APP_JWT_SECRET` y
  `PLATFORM_JWT_SECRET`), y cada uno rechaza los tokens del otro por verificación de firma.
- La tabla `app_users` es compartida por ambos servicios: contiene los usuarios internos de cada
  tenant (`ADMIN`/`STAFF`, con `tenant_id` obligatorio) y los operadores de plataforma
  (`PLATFORM_ADMIN`, con `tenant_id` nulo); desde V3 la base de datos exige esa coherencia.
- Los movimientos de puntos (acumulaciones y canjes) se registran en `points_movements`, que
  funciona como ledger **de solo inserción por diseño de la aplicación**: no existen endpoints ni
  servicios que lo modifiquen o borren. La base de datos no lo impide por sí misma (no hay
  triggers); el saldo de cada cliente se mantiene igual a la suma de su ledger.
- Los canjes validan el saldo **del programa** de la recompensa (según el ledger); el saldo que se
  muestra en el perfil es el global de todos los programas.
- La clasificación de clientes por tier (Bronze < 500 ≤ Silver < 2 000 ≤ Gold) se calcula en el
  backend desde el saldo actual y no se almacena en base de datos; el frontend solo muestra lo que
  envía el backend.
- El seeder de datos demo (`DevDataSeederConfig`) solo se ejecuta con el perfil `dev`, que es el
  único perfil existente y el que usa Docker.

---

## Documentación adicional

- `docs/AUDITORIA_AVANCE_1.md` — auditoría funcional y técnica del estado inicial del Avance 1.
- `docs/CAMBIOS_AVANCE1.md` — cambios realizados, problemas resueltos, decisiones y pendientes.
- `docs/MATRIZ_AVANCE.md` — requerimientos funcionales con estado, avance y evidencia.
- `docs/database/consultas-demo.sql` — consultas SQL de demostración.
