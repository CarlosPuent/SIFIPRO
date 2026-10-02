# SIFIPRO — Sistema de Fidelización Profesional

Plataforma SaaS multi-tenant para administrar programas de lealtad: puntos, recompensas y canjes
para comercios y empresas de servicios. Cada comercio (tenant) gestiona sus clientes, registra
compras que acumulan puntos automáticamente, procesa canjes y consulta reportes desde una
interfaz web, sin ver nunca los datos de otros comercios.

## Qué problema resuelve

Los programas de lealtad de los comercios pequeños y medianos suelen llevarse en hojas de cálculo
o tarjetas de sellos: los saldos no son confiables, no queda registro de quién otorgó o canjeó
puntos y no hay reportes. Contratar un sistema propio es costoso para un solo negocio.

SIFIPRO ofrece ese sistema como servicio compartido:

- cada comercio configura sus propias reglas de acumulación (puntos por dólar y compra mínima);
- los puntos se calculan en el servidor y cada movimiento queda en una bitácora de auditoría con
  su autor;
- los canjes validan saldo y stock, y los reportes muestran puntos emitidos y canjeados;
- el equipo de SIFIPRO da de alta, suspende y reactiva comercios desde un panel separado.

---

## Contenido

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Instalación rápida con Docker](#instalación-rápida-con-docker)
- [Credenciales demo](#credenciales-demo)
- [Flujo de prueba](#flujo-de-prueba)
- [Comandos útiles](#comandos-útiles)
- [Solución de problemas](#solución-de-problemas)
- [Módulos del sistema](#módulos-del-sistema)
- [Variables de entorno](#variables-de-entorno)
- [Documentación adicional](#documentación-adicional)

---

## Arquitectura

Cinco contenedores Docker: dos interfaces web, dos APIs y una base de datos compartida.

```
 Personal del comercio                      Equipo de plataforma SIFIPRO
          │                                              │
          ▼                                              ▼
 tenant-ui  :5173  (React + nginx)            platform-ui  :5174  (React + nginx)
          │  /api/* → proxy interno                      │  /api/* → proxy interno
          ▼                                              ▼
 tenant-api :8085  (Spring Boot)              platform-api :8086  (Spring Boot)
 ADMIN y STAFF de un comercio                 PLATFORM_ADMIN
 aplica las migraciones (Flyway)              no modifica el esquema
          │                                              │
          └──────────────► PostgreSQL 16 ◄───────────────┘
                     (solo accesible dentro de Docker)
```

- **Plano del comercio** (`sifipro-backend` + `sifipro-frontend`): clientes, compras, canjes,
  recompensas, programas, reportes, bitácora y usuarios internos.
- **Plano de plataforma** (`sifipro-platform-api` + `sifipro-platform-ui`): alta de comercios con
  su primer ADMIN, listado, suspensión y reactivación.
- **Multi-tenancy:** base de datos y esquema compartidos; cada tabla de negocio tiene `tenant_id`
  y cada consulta filtra por el comercio del usuario autenticado.
- **Seguridad:** cada plano firma sus tokens JWT con un secreto distinto, así que un token de un
  plano no sirve en el otro.

---

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Backends | Java 17, Spring Boot 4.0.5, Spring Security + JWT (jjwt 0.12.6), Spring Data JPA, Flyway, springdoc-openapi (Swagger) |
| Frontends | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Axios, Recharts |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker y Docker Compose, nginx, imágenes Alpine (Temurin 17, Node 22) |
| Pruebas | JUnit 5, Mockito, Testcontainers |

No hace falta instalar Java, Node.js, Maven ni PostgreSQL: todo se compila y se ejecuta dentro de
los contenedores.

---

## Instalación rápida con Docker

### Paso 1. Requisitos

| Requisito | Detalle |
|---|---|
| Docker Desktop | [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/). En Windows usa el motor **WSL 2** (el instalador lo propone por defecto; requiere la virtualización activada en la BIOS). |
| Git | [Descargar Git](https://git-scm.com/downloads). En Windows incluye Git Bash. |
| Memoria | 8 GB de RAM en el equipo. Los cinco contenedores usan menos de 1 GB; Docker Desktop requiere memoria adicional. |
| Disco | Unos 5 GB libres para imágenes y caché de compilación. |
| Puertos libres | **5173, 5174, 8085 y 8086**. |
| Internet | Solo en el primer arranque, para descargar imágenes y dependencias. |

Abre Docker Desktop, espera a que indique que el motor está en ejecución y confirma desde una
terminal (PowerShell o Git Bash):

```bash
docker version
```

La salida debe mostrar una sección **Client** y otra **Server**. Si solo aparece *Client* y un
error de conexión, Docker Desktop todavía no ha iniciado.

### Paso 2. Clonar el repositorio

```bash
git clone https://github.com/CarlosPuent/SIFIPRO.git
cd SIFIPRO
```

### Paso 3. Colocar el archivo `.env`

El sistema lee sus contraseñas y secretos de un archivo llamado exactamente `.env` en la **raíz
del proyecto** (la carpeta `SIFIPRO`, junto a `docker-compose.yml`). Este archivo no está en
el repositorio.

**Opción A — usar el `.env` que entrega el equipo (recomendada).** Copia el archivo recibido en
la carpeta `SIFIPRO`. Comprueba que se llame `.env` y no `.env.txt` ni `env`:

```powershell
# PowerShell
Get-ChildItem -Force .env
```

```bash
# Git Bash
ls -la .env
```

**Opción B — crearlo desde la plantilla.**

```powershell
# PowerShell
Copy-Item .env.example .env
```

```bash
# Git Bash
cp .env.example .env
```

Abre `.env` con un editor de texto y reemplaza los valores `change-me…`:

- `POSTGRES_PASSWORD` y `DB_PASSWORD`: la **misma** contraseña.
- `DB_USERNAME`: puede quedarse como `sifipro`.
- `APP_JWT_SECRET` y `PLATFORM_JWT_SECRET`: dos valores aleatorios **distintos**, de al menos 64
  caracteres. Ejecuta uno de estos comandos dos veces para obtenerlos:

```powershell
# PowerShell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

```bash
# Git Bash
openssl rand -base64 48
```

No subas nunca el archivo `.env` al repositorio (ya está excluido en `.gitignore`).

### Paso 4. Construir y levantar los contenedores

Desde la carpeta `SIFIPRO`:

```bash
docker compose up --build -d
```

La primera vez Docker descarga las imágenes base y las dependencias y compila los cuatro
servicios; puede tardar **entre 5 y 15 minutos** según la conexión. Las siguientes veces tarda
segundos. Al terminar, la terminal vuelve al prompt mostrando los contenedores como `Started`.

### Paso 5. Comprobar que todo está arriba

```bash
docker compose ps
```

Deben aparecer **cinco** servicios (`db`, `backend`, `platform-api`, `frontend` y
`platform-ui`) con estado `Up`, y `db` con `(healthy)`.

La API del comercio tarda unos segundos más en aplicar las migraciones y cargar los datos demo.
Espera a ver su mensaje de arranque:

```bash
docker compose logs -f backend
```

Cuando aparezca la línea `Sifipro Backend Application is running...`, pulsa **Ctrl + C** para
salir del registro (los contenedores siguen funcionando).

### Paso 6. Abrir el sistema

| Aplicación | URL | Para qué sirve |
|---|---|---|
| **tenant-ui** (panel del comercio) | http://localhost:5173 | Operación diaria: clientes, compras, canjes, reportes, bitácora |
| **platform-ui** (panel de plataforma) | http://localhost:5174 | Alta, suspensión y reactivación de comercios |
| **Swagger** (documentación de la API del comercio) | http://localhost:8085/swagger-ui.html | Probar los endpoints de tenant-api |

### Paso 7. Iniciar sesión

Usa las [credenciales demo](#credenciales-demo): por ejemplo `admin@sifipro.com` / `Admin123!`
en http://localhost:5173 y `platform-admin@sifipro.com` / `PlatformAdmin123!` en
http://localhost:5174.

Para usar Swagger: ejecuta `POST /api/auth/login` con un usuario del comercio, copia el
`accessToken` de la respuesta, pulsa **Authorize** y pégalo.

---

## Credenciales demo

Se crean automáticamente la primera vez que arranca el sistema con la base de datos vacía.

| Rol | Correo | Contraseña | Dónde se usa | Comercio |
|---|---|---|---|---|
| Operador de plataforma | platform-admin@sifipro.com | PlatformAdmin123! | platform-ui (5174) | — |
| Administrador | admin@sifipro.com | Admin123! | tenant-ui (5173) | `demo` |
| Personal operativo | staff@sifipro.com | Staff123! | tenant-ui (5173) | `demo` |
| Administrador | admin@cafenorte.com | Admin123! | tenant-ui (5173) | `cafe-norte` (Café del Norte) |

**Datos demo:**

- **`demo`**: 2 programas (*SIFIPRO Rewards*, 1.5 pts/$ con compra mínima de $25, y *Club Café*,
  2 pts/$ con mínima de $10), 15 clientes en los tres niveles (Bronze, Silver y Gold), 8
  recompensas (una agotada y dos con stock bajo), 62 compras repartidas en los últimos cuatro
  meses y 15 canjes.
- **`cafe-norte`**: 1 programa, 4 clientes, 3 recompensas, 10 compras y 2 canjes. Sirve para
  comprobar el aislamiento: al iniciar sesión con `admin@cafenorte.com` no se ve ningún dato de
  `demo`, aunque ambos comercios tienen una clienta con el mismo correo
  (`laura.mendoza@sifipro.dev`), cada una con su propio saldo.

**Permisos por rol:**

- **ADMIN**: todos los módulos de su comercio, incluidos usuarios, programas, ajustes de puntos y
  bitácora (**Audit Log**).
- **STAFF**: consulta y reportes; registra clientes, compras y canjes. No gestiona usuarios,
  programas ni recompensas, no ajusta puntos ni ve la bitácora (la interfaz oculta esas opciones y
  la API responde 403).
- **PLATFORM_ADMIN**: solo entra a platform-ui.

---

## Flujo de prueba

1. En http://localhost:5174 inicia sesión con `platform-admin@sifipro.com` / `PlatformAdmin123!`.
2. Pulsa **New Tenant** y completa nombre y código del comercio, más nombre, apellido, correo y
   contraseña de su primer ADMIN. El comercio aparece como **Active**.
3. En http://localhost:5173 (otra ventana o modo incógnito) inicia sesión con ese ADMIN. El
   comercio está vacío: crea un programa en **Programs**, selecciónalo en el **Dashboard** y
   registra un cliente, una recompensa, una compra y un canje. No aparece ningún dato de los
   comercios demo.
4. **Suspensión:** con esa sesión abierta, pulsa **Deactivate** en platform-ui. En la siguiente
   acción, tenant-ui cierra la sesión y avisa que la cuenta del comercio está suspendida; un
   nuevo inicio de sesión responde *"Tenant account is suspended."*.
5. Pulsa **Activate** y el ADMIN vuelve a entrar con normalidad.
6. Con `admin@sifipro.com`, abre un cliente, pulsa **Adjust points**, suma puntos con un motivo y
   revisa el movimiento en **Audit Log**, con tu usuario y el motivo.

---

## Comandos útiles

Todos se ejecutan desde la carpeta `SIFIPRO` y funcionan igual en PowerShell y Git Bash.

| Acción | Comando |
|---|---|
| Ver el estado de los contenedores | `docker compose ps` |
| Detener el sistema (conserva los datos) | `docker compose down` |
| Volver a iniciarlo | `docker compose up -d` |
| Reiniciar un servicio | `docker compose restart backend` |
| Ver los registros de un servicio (Ctrl + C para salir) | `docker compose logs -f backend` |
| Ver los registros de todos los servicios | `docker compose logs -f` |
| Reconstruir tras descargar cambios (`git pull`) | `docker compose up --build -d` |
| **Borrar todos los datos y volver a cargar la demo** | `docker compose down -v` y luego `docker compose up --build -d` |

`down -v` elimina la base de datos del proyecto: se pierden los comercios, clientes y movimientos
creados a mano y se vuelven a cargar los datos demo.

Los nombres de servicio para `logs` y `restart` son `db`, `backend`, `platform-api`, `frontend` y
`platform-ui`.

---

## Solución de problemas

**Docker no está iniciado.** `docker version` o `docker compose up` muestran un error como
`failed to connect to the docker API` o `error during connect`. Abre Docker Desktop, espera a que
indique que el motor está en ejecución y repite el comando. En Windows, si Docker Desktop pide
instalar o actualizar WSL, ejecuta en PowerShell como administrador `wsl --update` y reinicia el
equipo.

**Puerto ocupado.** El arranque falla con `Bind for 0.0.0.0:5173 failed: port is already
allocated` (o 5174, 8085, 8086). Averigua qué programa lo usa:

```powershell
# PowerShell
netstat -ano | findstr :5173
```

```bash
# Git Bash
netstat -ano | grep :5173
```

Cierra ese programa (el último número de la línea es su PID; en el Administrador de tareas se
busca por PID) o cambia el puerto de la izquierda en `docker-compose.yml`, por ejemplo
`"5180:80"` en lugar de `"5173:80"`, y abre la aplicación en el puerto nuevo.

**Falta el archivo `.env`.** Aparecen avisos como `The "DB_USERNAME" variable is not set` y la
base de datos o las APIs no arrancan. Revisa el [Paso 3](#paso-3-colocar-el-archivo-env): el
archivo debe llamarse `.env` y estar junto a `docker-compose.yml`. Después ejecuta
`docker compose down -v` y `docker compose up --build -d`.

**El primer build es lento.** Es normal: la primera vez se descargan alrededor de 1 GB entre
imágenes y dependencias de Maven y npm. Sigue el avance con `docker compose up --build` (sin
`-d`). Si se interrumpe por la conexión, vuelve a ejecutar `docker compose up --build -d`: lo ya
descargado queda en caché.

**Error de finales de línea (CRLF).** Si el build muestra `/bin/sh: ./mvnw: not found`,
`bad interpreter` o `$'\r': command not found`, algún archivo llegó con finales de línea de
Windows. El repositorio fuerza LF con `.gitattributes` y los Dockerfiles normalizan `mvnw`, así
que basta con usar un clon reciente: borra la carpeta, clona de nuevo
([Paso 2](#paso-2-clonar-el-repositorio)), vuelve a colocar el `.env` y reconstruye sin caché:

```bash
docker compose build --no-cache
docker compose up -d
```

**La base de datos tarda en quedar `healthy`.** En el primer arranque PostgreSQL inicializa sus
archivos y puede tardar hasta un minuto; mientras tanto `docker compose ps` muestra
`(health: starting)` y las APIs esperan a que termine. Si después de varios minutos `backend` o
`platform-api` no están `Up`, revisa `docker compose logs db` y vuelve a ejecutar
`docker compose up -d`.

**Error de autenticación de PostgreSQL** (`password authentication failed`) tras cambiar el
`.env`. La contraseña solo se aplica al crear la base de datos. Si cambiaste
`POSTGRES_PASSWORD`/`DB_PASSWORD` después del primer arranque, ejecuta `docker compose down -v` y
`docker compose up --build -d` (se vuelve a cargar la demo).

**La página carga pero el inicio de sesión falla con un error de red.** La API todavía está
arrancando: espera el mensaje del [Paso 5](#paso-5-comprobar-que-todo-está-arriba) y recarga la
página.

---

## Módulos del sistema

**tenant-api** (`sifipro-backend`, puerto 8085, documentada en Swagger)

| Módulo | Endpoint base | Acceso |
|---|---|---|
| Autenticación | `/api/auth` | Público (login) / autenticado (`/me`) |
| Clientes | `/api/customers` | ADMIN y STAFF consultan y crean; ADMIN edita, activa y desactiva |
| Ajustes de puntos | `/api/customers/{id}/adjustments` | ADMIN (motivo obligatorio; nunca deja saldo negativo) |
| Programas de lealtad | `/api/program-config` | ADMIN (STAFF solo consulta) |
| Recompensas | `/api/rewards` | ADMIN y STAFF consultan; ADMIN gestiona |
| Compras | `/api/transactions` | ADMIN y STAFF |
| Canjes | `/api/redemptions` | ADMIN y STAFF (valida saldo del programa y stock) |
| Reportes y exportación CSV | `/api/reports` | ADMIN y STAFF (solo lectura) |
| Bitácora de auditoría | `/api/audit/points-movements` | ADMIN |
| Usuarios internos | `/api/users` | ADMIN |
| Estado del servicio | `/api/health` | Público |

**platform-api** (`sifipro-platform-api`, puerto 8086)

| Módulo | Endpoint base | Acceso |
|---|---|---|
| Autenticación | `/api/platform/auth` | Público (login) / PLATFORM_ADMIN (`/me`) |
| Comercios (tenants) | `/api/platform/tenants` | PLATFORM_ADMIN |
| Estado del servicio | `/api/platform/health` | Público |

Todos los datos de un comercio se filtran por el comercio del usuario autenticado: un recurso de
otro comercio responde 404. El esquema de la base de datos se crea con las migraciones Flyway
`V1` a `V4` de `sifipro-backend/src/main/resources/db/migration/`.

---

## Variables de entorno

Se definen en el archivo `.env` de la raíz (plantilla: `.env.example`). Ninguna tiene valor por
defecto en el código: si falta una, el servicio correspondiente no arranca.

| Variable | Descripción | La usa |
|---|---|---|
| `POSTGRES_PASSWORD` | Contraseña con la que se inicializa PostgreSQL | `db` |
| `DB_USERNAME` | Usuario de PostgreSQL | `db`, `backend`, `platform-api` |
| `DB_PASSWORD` | Contraseña de `DB_USERNAME` (igual a `POSTGRES_PASSWORD`) | `backend`, `platform-api` |
| `APP_JWT_SECRET` | Secreto de firma de los tokens del comercio (64+ caracteres) | `backend` |
| `PLATFORM_JWT_SECRET` | Secreto de firma de los tokens de plataforma, **distinto** del anterior | `platform-api` |

---

## Documentación adicional

- `docs/MATRIZ_AVANCE.md`: requerimientos de la propuesta con estado, avance y evidencia.
- `docs/CAMBIOS_AVANCE1.md`: cambios del Avance 1, decisiones técnicas y pendientes.
- `docs/AUDITORIA_AVANCE_1.md`: auditoría funcional y técnica del estado inicial.
- `docs/database/consultas-demo.sql`: consultas SQL de demostración
  (`docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d sifipro_db'`).
