# SIFIPRO — Sistema de Fidelización Profesional

Plataforma SaaS multi-tenant para la gestión de programas de lealtad, puntos y recompensas en comercios y empresas de servicios. Permite a distintos negocios administrar clientes, registrar transacciones, acumular puntos automáticamente y procesar canjes de recompensas desde una interfaz web centralizada.

El sistema está dividido en dos planos independientes:

- **Plano de tenant** (`sifipro-backend` + `sifipro-frontend`): la operación diaria de un comercio — clientes, transacciones, recompensas, canjes, usuarios internos.
- **Plano de plataforma** (`sifipro-platform-api` + `sifipro-platform-ui`): la administración de tenants por el equipo de SIFIPRO — alta, listado, activación/desactivación de comercios.

Ambos planos comparten una única base de datos PostgreSQL, pero **solo `sifipro-backend` gestiona el esquema** (vía Flyway); `sifipro-platform-api` únicamente lee/escribe sobre las tablas compartidas (`tenants`, `app_users`) sin nunca crearlas ni migrarlas.

---

## Contenido

- [Arquitectura](#arquitectura)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Inicio rápido con Docker](#inicio-rápido-con-docker)
- [Credenciales demo](#credenciales-demo)
- [Flujo de prueba end-to-end](#flujo-de-prueba-end-to-end)
- [Desarrollo local sin Docker](#desarrollo-local-sin-docker)
- [Variables de entorno](#variables-de-entorno)
- [Documentación de la API](#documentación-de-la-api)
- [Módulos del sistema](#módulos-del-sistema)
- [Notas técnicas](#notas-técnicas)

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

**Tenant-api / tenant-ui** — lo que usa el personal de un comercio día a día: registrar clientes, procesar transacciones y canjes, gestionar el catálogo de recompensas y los programas de lealtad. La arquitectura multi-tenant se implementa a nivel de base de datos: cada entidad incluye un `tenant_id`, y el JWT de sesión (firmado con `APP_JWT_SECRET`) transporta el identificador del tenant para que todos los servicios filtren automáticamente la información correspondiente.

**Platform-api / platform-ui** — lo que usa el equipo de SIFIPRO para administrar el negocio como plataforma SaaS: crear tenants nuevos (junto con su primer usuario ADMIN), listarlos y activar/desactivar su acceso. Se autentica con un rol distinto (`PLATFORM_ADMIN`) y un JWT firmado con un secreto completamente separado (`PLATFORM_JWT_SECRET`) — un token de un plano nunca es válido en el otro, ni por accidente.

---

## Tecnologías

**tenant-api** (`sifipro-backend`) y **platform-api** (`sifipro-platform-api`)

- Java 17 / Spring Boot 4
- Spring Security con autenticación JWT (secretos de firma independientes por servicio)
- Spring Data JPA / Hibernate
- PostgreSQL 16
- Maven
- Flyway (solo en tenant-api — es el único dueño del esquema compartido)

**tenant-ui** (`sifipro-frontend`) y **platform-ui** (`sifipro-platform-ui`)

- React con TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Sonner (notificaciones)

**Infraestructura**

- Docker y Docker Compose
- nginx (Alpine) sirviendo ambos frontends y proxeando `/api/*`
- Eclipse Temurin JDK/JRE 17 (Alpine) para ambos backends
- Node 22 (Alpine) como etapa de build de ambos frontends

---

## Estructura del proyecto

```
SIFIPRO/
├── docker-compose.yml           Orquestación de los 5 contenedores (db + 4 servicios)
├── .env.example                 Plantilla de variables de entorno
├── README.md
│
├── sifipro-backend/             tenant-api — Spring Boot, dueño único del esquema
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/puent/sifipro/
│       │   ├── auth/            Autenticación JWT de tenant (login, /me)
│       │   ├── config/          Configuración y seeder de datos de dev
│       │   ├── customer/        Gestión de clientes
│       │   ├── loyalty/         Programas de fidelización
│       │   ├── redemption/      Canjes de recompensas
│       │   ├── reward/          Catálogo de recompensas
│       │   ├── tenant/          Entidad Tenant (el ciclo de vida lo administra platform-api)
│       │   ├── transaction/     Transacciones y movimientos de puntos
│       │   └── user/            Usuarios internos (ADMIN/STAFF)
│       └── resources/
│           ├── application.properties
│           ├── application-dev.properties
│           └── db/migration/    Migraciones Flyway (V1__baseline_schema.sql, V2__..., ...)
│
├── sifipro-frontend/            tenant-ui — React, operación diaria del comercio
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── auth/                Contexto de autenticación y guards
│       ├── modules/             Módulos por dominio (customers, rewards, transactions, ...)
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

No se requiere instalar Java, Node.js, Maven ni PostgreSQL. Todos los componentes se ejecutan dentro de los contenedores Docker.

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

Para detener y eliminar los datos de la base de datos (vuelve a un estado limpio, re-sembrado
automáticamente en el próximo arranque):

```bash
docker compose down -v
```

---

## Credenciales demo

En perfil `dev`, `DevDataSeederConfig` (dentro de `sifipro-backend`) crea automáticamente, en
cada arranque contra una base vacía:

- El operador de plataforma semilla (sin tenant asociado).
- Un tenant de demostración con datos de ejemplo (clientes, programa de lealtad, recompensas,
  transacciones y canjes) y sus dos usuarios internos.

| Rol                    | Correo                     | Contraseña        | Se usa en     | Acceso                           |
| ---------------------- | -------------------------- | ----------------- | ------------- | -------------------------------- |
| Operador de plataforma | platform-admin@sifipro.com | PlatformAdmin123! | `platform-ui` | Gestión de tenants               |
| Administrador (tenant) | admin@sifipro.com          | Admin123!         | `tenant-ui`   | Total dentro del tenant demo     |
| Personal operativo     | staff@sifipro.com          | Staff123!         | `tenant-ui`   | Operativo dentro del tenant demo |

El administrador de tenant tiene acceso a todos los módulos de `tenant-ui` incluyendo gestión de
usuarios y configuración de programas. El personal operativo puede registrar transacciones,
clientes y canjes, pero no accede a la configuración interna del tenant. El operador de
plataforma solo existe en `platform-ui` — no puede iniciar sesión en `tenant-ui` aunque su fila
viva en la misma tabla `app_users`, porque `platform-api` rechaza explícitamente cualquier login
cuyo rol no sea `PLATFORM_ADMIN`.

---

## Flujo de prueba end-to-end

Esta es la prueba que demuestra que la separación entre plataforma y tenant funciona de verdad —
un tenant creado desde `platform-ui` queda inmediatamente operable en `tenant-ui`, sin ningún
paso manual adicional:

1. Abre `platform-ui` (http://localhost:5174) e inicia sesión con
   `platform-admin@sifipro.com` / `PlatformAdmin123!`.
2. En la pantalla de Tenants, pulsa **New Tenant** y completa el formulario: nombre y código del
   tenant, más nombre, apellido, email y contraseña de su primer usuario ADMIN.
3. Al crearse, el tenant aparece en la tabla con estado **Active**.
4. Abre `tenant-ui` (http://localhost:5173, puede ser otra pestaña o navegador) e inicia sesión
   con el email y contraseña del ADMIN que acabas de crear — funciona de inmediato.
5. Confirma que el ADMIN opera con normalidad dentro de su tenant nuevo (por ejemplo, la lista de
   clientes carga vacía, sin ningún error de autorización, porque es un tenant sin datos
   todavía).

Como prueba adicional del control de acceso: intenta desactivar ese tenant desde `platform-ui`
(botón **Deactivate**, pide confirmación) y confirma que su badge cambia a **Inactive**.

---

## Desarrollo local sin Docker

Para ejecutar el proyecto en modo desarrollo sin contenedores, cada componente debe iniciarse por
separado. Necesitas correr **al menos tenant-api + tenant-ui**, o **al menos platform-api +
platform-ui**, según qué plano quieras probar — ambos requieren la misma base de datos
PostgreSQL local.

**Requisitos adicionales para desarrollo local**

- Java 17 (OpenJDK o Oracle JDK)
- Maven 3.8+
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

# Configurar src/.env
# VITE_API_BASE_URL=http://localhost:8081

npm install
npm run dev
```

La aplicación abre en `http://localhost:5173`.

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

La aplicación abre en `http://localhost:5174`. A diferencia de `tenant-ui`, no requiere configurar
ningún `.env`: `vite.config.ts` ya incluye un proxy de desarrollo hacia
`http://localhost:8082`, el mismo mecanismo que usa nginx en producción.

---

## Variables de entorno

**Backends (definidas en `.env` en la raíz del repo, ver `.env.example`)**

Ninguna tiene un valor por defecto embebido en el código: si falta alguna, el arranque del
servicio correspondiente falla con un error claro en vez de usar un secreto de ejemplo
silenciosamente.

| Variable                 | Descripción                                                                              | Usada por                              |
| ------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| `POSTGRES_PASSWORD`      | Password de inicialización del contenedor `db`                                           | `db`                                   |
| `DB_USERNAME`            | Usuario/rol de Postgres, compartido por ambos backends                                   | `db`, `tenant-api`, `platform-api`     |
| `DB_PASSWORD`            | Contraseña de `DB_USERNAME`                                                              | `db`, `tenant-api`, `platform-api`     |
| `APP_JWT_SECRET`         | Clave para firmar tokens JWT de tenant-api                                               | `tenant-api`                           |
| `PLATFORM_JWT_SECRET`    | Clave para firmar tokens JWT de platform-api — **debe ser distinta de `APP_JWT_SECRET`** | `platform-api`                         |
| `SPRING_DATASOURCE_URL`  | URL de conexión a PostgreSQL (misma base para ambos backends)                            | `jdbc:postgresql://db:5432/sifipro_db` |
| `SPRING_PROFILES_ACTIVE` | Perfil activo de Spring (solo tenant-api tiene split dev/prod)                           | `dev` (solo `tenant-api`)              |

**Frontends (build argument en Docker)**

| Variable            | Servicio      | Valor en Docker                             |
| ------------------- | ------------- | ------------------------------------------- |
| `VITE_API_URL`      | `tenant-ui`   | `""` (relativo, proxy nginx a tenant-api)   |
| `VITE_API_BASE_URL` | `platform-ui` | `""` (relativo, proxy nginx a platform-api) |

---

## Documentación de la API

Con el sistema corriendo, la documentación interactiva de **tenant-api** está disponible en:

```
http://localhost:8085/swagger-ui.html
```

La especificación OpenAPI en formato JSON está en:

```
http://localhost:8085/v3/api-docs
```

`platform-api` no expone Swagger/OpenAPI en esta etapa del proyecto.

Todos los endpoints protegidos (en ambos servicios) requieren un token JWT en el encabezado
`Authorization: Bearer <token>`, obtenido desde el endpoint de login correspondiente. Un token de
`tenant-api` nunca es válido en `platform-api`, ni viceversa.

---

## Módulos del sistema

**tenant-api** (`sifipro-backend`, base `/api`)

| Módulo               | Endpoint base         | Roles con acceso                             |
| -------------------- | --------------------- | -------------------------------------------- |
| Autenticación        | `/api/auth`           | Público (login) / autenticado (`/me`)        |
| Clientes             | `/api/customers`      | ADMIN, STAFF                                 |
| Programas de lealtad | `/api/program-config` | ADMIN (lectura también STAFF)                |
| Recompensas          | `/api/rewards`        | ADMIN, STAFF (lectura); ADMIN (alta/edición) |
| Transacciones        | `/api/transactions`   | ADMIN, STAFF                                 |
| Canjes               | `/api/redemptions`    | ADMIN, STAFF                                 |
| Usuarios internos    | `/api/users`          | ADMIN                                        |
| Health check         | `/actuator/health`    | Público                                      |

**platform-api** (`sifipro-platform-api`, base `/api/platform`)

| Módulo        | Endpoint base                              | Roles con acceso                         |
| ------------- | ------------------------------------------ | ---------------------------------------- |
| Autenticación | `/api/platform/auth`                       | Público (login) / PLATFORM_ADMIN (`/me`) |
| Tenants       | `/api/platform/tenants`                    | PLATFORM_ADMIN                           |
| Health check  | `/api/platform/health`, `/actuator/health` | Público                                  |

---

## Notas técnicas

- El esquema de base de datos es gestionado exclusivamente por **Flyway**, y solo desde
  `sifipro-backend` (ver `sifipro-backend/src/main/resources/db/migration/`). `sifipro-platform-api`
  mapea las mismas tablas compartidas (`tenants`, `app_users`) pero nunca las crea ni las altera:
  corre con `spring.jpa.hibernate.ddl-auto=none` y Flyway deshabilitado. Si alguna vez ambos
  servicios intentaran administrar el esquema, se producirían migraciones en conflicto — por
  diseño, solo tenant-api tiene ese privilegio.
- `tenant-api` y `platform-api` firman sus JWT con secretos completamente distintos
  (`APP_JWT_SECRET` y `PLATFORM_JWT_SECRET`), y cada uno rechaza los tokens del otro por
  construcción (verificación de firma), no solo por convención.
- La tabla `app_users` es compartida por ambos servicios: contiene tanto los usuarios internos de
  cada tenant (`ADMIN`/`STAFF`, con `tenant_id` obligatorio) como los operadores de plataforma
  (`PLATFORM_ADMIN`, con `tenant_id` nulo). `platform-api` rechaza cualquier intento de login cuyo
  rol no sea `PLATFORM_ADMIN`, aunque la fila exista y la contraseña sea correcta.
- Los movimientos de puntos (acumulaciones y canjes) se registran en una tabla `points_movements`
  que actúa como ledger inmutable, garantizando trazabilidad completa de cada operación.
- La clasificación de clientes por tier (Bronze, Silver, Gold) se calcula dinámicamente desde el
  balance de puntos y no se almacena en base de datos.
- El seeder de datos demo (`DevDataSeederConfig`, en `sifipro-backend`) solo se ejecuta con el
  perfil `dev` activo. Siembra el operador de plataforma semilla si no existe (paso independiente
  del resto), y el tenant demo con sus usuarios y datos de ejemplo únicamente si la base de datos
  está vacía — es seguro en reinicios.
