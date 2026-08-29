# Auditoría de Infraestructura — SIFIPRO

Fecha: 2026-08-29
Alcance: `docker-compose.yml`, variables de entorno, base de datos/migraciones, Keycloak, CI/CD.
Método: revisión estática de archivos en el repositorio (sin ejecutar ni modificar nada).

---

## 1. Qué existe y funciona

### Docker Compose ([docker-compose.yml](../../docker-compose.yml))
- Orquesta 3 servicios: `db` (PostgreSQL 16-alpine), `backend` (Spring Boot, build desde `sifipro-backend/Dockerfile`) y `frontend` (React + nginx, build desde `sifipro-frontend/Dockerfile`).
- `db` expone healthcheck (`pg_isready`) y `backend` depende de `db` con `condition: service_healthy` — arranque ordenado correcto.
- Persistencia de datos vía volumen nombrado `sifipro-pgdata`.
- Red dedicada `sifipro-net` (bridge) aísla los tres contenedores.
- Puertos: `db` no se expone al host (solo red interna, correcto); `backend` se expone en `8085:8081` explícitamente para debug/Swagger; `frontend` en `5173:80`.
- El frontend usa build arg `VITE_API_URL=""` para que nginx (ver [nginx.conf](../../sifipro-frontend/nginx.conf)) proxee `/api/*` al backend dentro de la red Docker — evita CORS en producción. Coincide con lo documentado en [README.md](../../README.md) líneas 26-43.

### Dockerfiles
- [sifipro-backend/Dockerfile](../../sifipro-backend/Dockerfile): multi-stage (JDK Alpine para build, JRE Alpine para runtime), usuario no-root (`sifipro`), corrige line endings de `mvnw` para compatibilidad Windows→Linux. Bien construido.
- [sifipro-frontend/Dockerfile](../../sifipro-frontend/Dockerfile) + [nginx.conf](../../sifipro-frontend/nginx.conf): sirve estáticos, proxy `/api/` al contenedor `backend:8081`, cache de assets estáticos con `immutable`, `no-cache` para `index.html`, gzip habilitado. Configuración de nginx razonable para SPA.

### Variables de entorno
- `docker-compose.yml` inyecta `SPRING_PROFILES_ACTIVE`, `SPRING_DATASOURCE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `APP_JWT_SECRET` directamente como `environment:` del servicio `backend` — funciona para levantar el stack.
- [sifipro-frontend/.env](../../sifipro-frontend/.env) existe con `VITE_API_BASE_URL=http://localhost:8081` para desarrollo local fuera de Docker.
- `.gitignore` raíz excluye correctamente `.env` y `*.env`; `sifipro-frontend/.dockerignore` también excluye `.env*` del build context.

### Base de datos
- Motor: PostgreSQL 16 (imagen oficial `postgres:16-alpine`).
- Conexión configurada en [application-dev.properties](../../sifipro-backend/src/main/resources/application-dev.properties) con fallback por defecto (`DB_USERNAME:postgres`, `DB_PASSWORD:83Dakota77`) para desarrollo local sin Docker.
- Esquema gestionado por Hibernate con `spring.jpa.hibernate.ddl-auto=update` — funciona para desarrollo, documentado explícitamente como decisión intencional en [README.md líneas 279-284](../../README.md).
- Seeder de datos demo (`DevDataSeederConfig`, en `sifipro-backend/src/main/java/com/puent/sifipro/config/`) solo corre en perfil `dev` y solo si la base está vacía — mecanismo idempotente razonable.
- Existe un script SQL manual documentado: [sifipro-backend/src/main/resources/db/manual-applied/V6__refactor_transactions_program_scope.sql](../../sifipro-backend/src/main/resources/db/manual-applied/V6__refactor_transactions_program_scope.sql) — indica que hubo al menos un cambio de esquema aplicado a mano fuera de Hibernate.

### Seguridad de aplicación (relacionado con infra)
- [SecurityConfig.java](../../sifipro-backend/src/main/java/com/puent/sifipro/config/SecurityConfig.java): JWT stateless, reglas de autorización por rol (`ADMIN`/`STAFF`) y por endpoint, coincide con la tabla de módulos del README.
- [CorsConfig.java](../../sifipro-backend/src/main/java/com/puent/sifipro/config/CorsConfig.java): origen permitido restringido a `http://localhost:5173` — correcto para el entorno actual de desarrollo/single-host.

### Documentación
- [README.md](../../README.md) es detallado y está alineado con la configuración real: arquitectura, variables de entorno, credenciales demo, instrucciones Docker y sin Docker.

---

## 2. Qué existe pero está roto o incompleto

- **Flyway está declarado pero deshabilitado y vacío.** `pom.xml` incluye `spring-boot-starter-flyway` y `flyway-database-postgresql` (líneas 46-49 y 79-82), pero `application.properties` línea 5 tiene `spring.flyway.enabled=false`, y el directorio [sifipro-backend/src/main/resources/db/migration/](../../sifipro-backend/src/main/resources/db/migration/) está **vacío**. Es decir, la dependencia se descarga y compila pero no se usa — deuda técnica o migración a medias, no una decisión "limpia" (si la intención es no usar Flyway, la dependencia debería removerse del `pom.xml`).
- **Migración manual fuera de todo sistema de control de esquema.** El script `V6__refactor_transactions_program_scope.sql` sigue la convención de nombres de Flyway (`V6__...`) pero vive en una carpeta `manual-applied` que Flyway no lee (Flyway deshabilitado además). No hay forma de saber, solo mirando el repo, si ese script ya se aplicó a la base de datos de cada entorno, ni hay V1-V5 documentados — sugiere que hubo migraciones previas no versionadas en el repositorio.
- **`ddl-auto=update` en `application-dev.properties`** es aceptable para desarrollo pero no hay un perfil equivalente para producción (`application-prod.properties` no existe) que use una estrategia más segura (`validate` o Flyway real). Si el proyecto pasa a producción con el `docker-compose.yml` actual (`SPRING_PROFILES_ACTIVE: dev`), seguiría usando `ddl-auto=update` y datos de seed de desarrollo.
- **Secretos hardcodeados en `docker-compose.yml`.** `POSTGRES_PASSWORD: Sifipro2024!`, `DB_PASSWORD: Sifipro2024!` y `APP_JWT_SECRET: z9BqL4xV2mR8pW6jN3cK7hT5fD1sY0gH4vM2kF9bD6nJ3rP8tC` están en texto plano dentro del archivo versionado en git (no hay `.env` referenciado con `env_file:`, ni uso de secrets de Docker). El mismo `APP_JWT_SECRET` también aparece hardcodeado como valor por defecto en `application-dev.properties` línea 13. Esto es aceptable únicamente si el proyecto se mantiene 100% local/demo; no es apto para ningún entorno compartido o público tal como está.
- **No existe archivo `.env.example` / `.env.sample`** en ninguna parte del repo (raíz, backend ni frontend), pese a que el `.gitignore` excluye `.env`. Un desarrollador nuevo no tiene una plantilla de referencia — solo la tabla de variables en el README, que puede desincronizarse del código real.
- **Puerto de debug expuesto sin protección.** El comentario en `docker-compose.yml` línea 39 dice que el puerto `8085` es "solo para debug/Swagger", pero no hay ninguna restricción real (firewall, perfil condicional, etc.) que lo limite — cualquier host con acceso a la red del Docker host puede llegar a Swagger UI y a la API directamente, sin pasar por nginx/CORS.

---

## 3. Qué falta por completo

- **Keycloak (o cualquier IdP externo): no existe.** No hay servicio `keycloak` en `docker-compose.yml`, ni carpetas de realms/clients/roles, ni configuración de OAuth2/OIDC en el backend. La autenticación es 100% JWT propio (`jjwt` + `SecurityConfig.java` + `CustomUserDetailsService`), gestionado íntegramente por la aplicación Spring Boot. Si el proyecto tiene en su roadmap migrar a Keycloak, es un trabajo desde cero.
- **CI/CD: no existe ningún pipeline.** No hay carpeta `.github/workflows/`, ni `.gitlab-ci.yml`, ni `Jenkinsfile`, ni `azure-pipelines.yml` en todo el repositorio. No hay build, test, ni deploy automatizado — todo el ciclo (`docker compose up --build`) es manual, según lo describe el propio README.
- **No hay tests automatizados visibles en ejecución continua.** El `pom.xml` incluye dependencias `-test` (actuator-test, data-jpa-test, security-test, etc.) pero, al no haber pipeline CI, no hay evidencia de que se ejecuten sistemáticamente; no se auditó el contenido de `src/test` en detalle (fuera del alcance de infraestructura), pero no hay ningún job que los dispare automáticamente en push/PR.
- **No hay configuración de logging centralizado ni monitoreo/observabilidad** más allá de `management.endpoints.web.exposure.include=health,info` (Actuator básico). No hay Prometheus, Grafana, ELK, ni un `logs/` gestionado (solo excluido en `.gitignore`).
- **No hay gestión de secretos.** No se usa Docker secrets, Vault, ni variables inyectadas desde un `.env` externo con `env_file:` — todos los valores sensibles están en texto plano dentro del propio `docker-compose.yml` versionado.
- **No hay configuración de backups de PostgreSQL** (ni scripts, ni cron, ni servicio adicional tipo `pgbackrest`/`wal-g`). El volumen `sifipro-pgdata` es la única persistencia y depende enteramente del host Docker.
- **No hay `docker-compose.override.yml` ni variantes por entorno** (dev/staging/prod) — un único archivo cubre todo, reforzando el hallazgo de la sección 2 sobre falta de perfil de producción.
- **No hay reverse proxy / TLS a nivel de infraestructura.** nginx sirve HTTP plano en el puerto 80/5173, sin certificados ni terminación TLS; no hay Traefik/Caddy ni configuración HTTPS en ningún archivo del repo.
