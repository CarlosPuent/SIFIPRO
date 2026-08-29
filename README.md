# SIFIPRO — Sistema de Fidelización Profesional

Plataforma SaaS multi-tenant para la gestión de programas de lealtad, puntos y recompensas en comercios y empresas de servicios. Permite a distintos negocios administrar clientes, registrar transacciones, acumular puntos automáticamente y procesar canjes de recompensas desde una interfaz web centralizada.

---

## Contenido

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Inicio rápido con Docker](#inicio-rápido-con-docker)
- [Credenciales demo](#credenciales-demo)
- [Desarrollo local sin Docker](#desarrollo-local-sin-docker)
- [Variables de entorno](#variables-de-entorno)
- [Documentación de la API](#documentación-de-la-api)
- [Módulos del sistema](#módulos-del-sistema)

---

## Arquitectura

SIFIPRO sigue una arquitectura cliente-servidor con separación estricta entre capas:

```
Browser
   |
   v
nginx (puerto 5173)
   |-- /             → sirve la aplicación React (archivos estáticos)
   |-- /api/*        → proxy inverso al backend Spring Boot
   |
   v
Spring Boot (puerto interno 8081)
   |
   v
PostgreSQL (puerto interno 5432)
```

El frontend no realiza llamadas cross-origin. Todas las peticiones a `/api/*` son interceptadas por nginx y redirigidas al contenedor del backend dentro de la red Docker privada, eliminando la necesidad de configuración CORS en producción.

La arquitectura multi-tenant se implementa a nivel de base de datos: cada entidad incluye un `tenant_id`, y el JWT de sesión transporta el identificador del tenant para que todos los servicios filtren automáticamente la información correspondiente.

---

## Tecnologías

**Backend**

- Java 17 / Spring Boot 4
- Spring Security 6 con autenticación JWT
- Spring Data JPA / Hibernate
- PostgreSQL 16
- Maven

**Frontend**

- React 18 con TypeScript
- Vite 6
- Tailwind CSS
- Axios

**Infraestructura**

- Docker y Docker Compose
- nginx (Alpine)
- Eclipse Temurin JRE 17 (Alpine)

---

## Estructura del proyecto

```
SIFIPRO/
├── docker-compose.yml          Orquestación de los tres contenedores
├── README.md
│
├── sifipro-backend/            Servidor Spring Boot
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/puent/sifipro/
│           │   ├── auth/           Autenticación y JWT
│           │   ├── config/         Configuración y seeder de datos
│           │   ├── customer/       Gestión de clientes
│           │   ├── loyalty/        Programas de fidelización
│           │   ├── redemption/     Canjes de recompensas
│           │   ├── report/         Reportes y estadísticas
│           │   ├── reward/         Catálogo de recompensas
│           │   ├── tenant/         Gestión de tenants
│           │   ├── transaction/    Transacciones y movimientos de puntos
│           │   └── user/           Usuarios internos
│           └── resources/
│               ├── application.properties
│               └── application-dev.properties
│
└── sifipro-frontend/           Aplicación React
    ├── Dockerfile
    ├── nginx.conf
    ├── .dockerignore
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── auth/               Contexto de autenticación y guards
        ├── modules/            Módulos por dominio (customers, rewards, etc.)
        ├── components/         Componentes compartidos y layout
        ├── lib/                Cliente HTTP y utilidades
        └── services/           Servicios de API por módulo
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

Edita `.env` y completa `POSTGRES_PASSWORD`, `DB_USERNAME`, `DB_PASSWORD` y `APP_JWT_SECRET`
con valores reales (no uses los placeholders de ejemplo). `.env` está excluido de git —
nunca lo subas al repositorio.

**3. Levantar todos los servicios**

```bash
docker compose up --build
```

Docker construirá las imágenes del backend y del frontend, descargará la imagen de PostgreSQL y levantará los tres contenedores. El proceso completo toma varios minutos la primera vez; las ejecuciones posteriores son significativamente más rápidas gracias al caché de capas.

**4. Esperar a que el sistema esté listo**

El sistema está listo cuando aparece el siguiente mensaje en la consola:

```
sifipro-backend | Sifipro Backend Application is running...
```

**5. Abrir el sistema**

```
http://localhost:5173
```

Para detener todos los servicios:

```bash
docker compose down
```

Para detener y eliminar los datos de la base de datos:

```bash
docker compose down -v
```

---

## Credenciales demo

Al primer arranque el sistema crea automáticamente un tenant de demostración con datos de ejemplo (clientes, programa de lealtad, recompensas, transacciones y canjes).

| Rol                | Correo            | Contraseña | Acceso    |
| ------------------ | ----------------- | ---------- | --------- |
| Administrador      | admin@sifipro.com | Admin123!  | Total     |
| Personal operativo | staff@sifipro.com | Staff123!  | Operativo |

El administrador tiene acceso a todos los módulos incluyendo gestión de usuarios y configuración de programas. El personal operativo puede registrar transacciones, clientes y canjes, pero no accede a la configuración interna del tenant.

---

## Desarrollo local sin Docker

Para ejecutar el proyecto en modo desarrollo sin contenedores, cada componente debe iniciarse por separado.

**Requisitos adicionales para desarrollo local**

- Java 17 (OpenJDK o Oracle JDK)
- Maven 3.8+
- Node.js 22+ con npm
- PostgreSQL 14+ corriendo localmente

**Backend**

```bash
cd sifipro-backend

# El backend ya no tiene valores por defecto embebidos: DB_USERNAME, DB_PASSWORD y
# APP_JWT_SECRET deben existir como variables de entorno o el arranque falla.
export DB_USERNAME=sifipro
export DB_PASSWORD=tu_contraseña
export APP_JWT_SECRET=$(openssl rand -base64 48)

./mvnw spring-boot:run
```

El servidor inicia en `http://localhost:8081`.

**Frontend**

```bash
cd sifipro-frontend

# Configurar src/.env
# VITE_API_URL=http://localhost:8081

npm install
npm run dev
```

La aplicación abre en `http://localhost:5173`. El servidor de desarrollo de Vite incluye un proxy configurado que redirige las llamadas a `/api/*` al backend, evitando problemas de CORS en modo desarrollo.

---

## Variables de entorno

**Backend (docker-compose.yml / application-dev.properties)**

Definidas en `.env` en la raíz del repo (ver `.env.example`). Ninguna tiene un valor por
defecto embebido en el código: si falta alguna, el arranque falla con un error claro en
vez de usar un secreto de ejemplo silenciosamente.

| Variable                 | Descripción                                    | Origen                                 |
| ------------------------ | ----------------------------------------------- | -------------------------------------- |
| `POSTGRES_PASSWORD`      | Password de inicialización del contenedor `db`  | `.env`                                 |
| `DB_USERNAME`            | Usuario/rol de Postgres usado por el backend    | `.env`                                 |
| `DB_PASSWORD`            | Contraseña de `DB_USERNAME`                     | `.env`                                 |
| `APP_JWT_SECRET`         | Clave secreta para firmar tokens JWT            | `.env`                                 |
| `SPRING_DATASOURCE_URL`  | URL de conexión a PostgreSQL                    | `jdbc:postgresql://db:5432/sifipro_db` |
| `SPRING_PROFILES_ACTIVE` | Perfil activo de Spring                         | `dev`                                  |

**Frontend (build argument en Docker)**

| Variable       | Descripción        | Valor en Docker              |
| -------------- | ------------------ | ---------------------------- |
| `VITE_API_URL` | URL base de la API | `""` (relativo, proxy nginx) |

---

## Documentación de la API

Con el sistema corriendo, la documentación interactiva de la API está disponible en:

```
http://localhost:8085/swagger-ui.html
```

La especificación OpenAPI en formato JSON está en:

```
http://localhost:8085/v3/api-docs
```

El puerto `8085` corresponde al mapeo externo del contenedor backend. Todos los endpoints protegidos requieren un token JWT en el encabezado `Authorization: Bearer <token>`, obtenido desde el endpoint de login.

---

## Módulos del sistema

| Módulo               | Endpoint base       | Roles con acceso |
| -------------------- | ------------------- | ---------------- |
| Autenticación        | `/api/auth`         | Público          |
| Clientes             | `/api/customers`    | ADMIN, STAFF     |
| Programas de lealtad | `/api/programs`     | ADMIN            |
| Recompensas          | `/api/rewards`      | ADMIN, STAFF     |
| Transacciones        | `/api/transactions` | ADMIN, STAFF     |
| Canjes               | `/api/redemptions`  | ADMIN, STAFF     |
| Usuarios internos    | `/api/users`        | ADMIN            |
| Health check         | `/actuator/health`  | Público          |

---

## Notas técnicas

- El esquema de base de datos es gestionado por Hibernate con `ddl-auto=update`. No se utiliza Flyway para migraciones en el entorno actual.
- Los movimientos de puntos (acumulaciones y canjes) se registran en una tabla `points_movements` que actúa como ledger inmutable, garantizando trazabilidad completa de cada operación.
- La clasificación de clientes por tier (Bronze, Silver, Gold) se calcula dinámicamente desde el balance de puntos y no se almacena en base de datos.
- El seeder de datos demo (`DevDataSeederConfig`) solo se ejecuta con el perfil `dev` activo y únicamente cuando la base de datos está vacía, por lo que es seguro en reinicios.
