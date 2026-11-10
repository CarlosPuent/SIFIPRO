# Matriz final de requerimientos — SIFIPRO (entrega final)

> **Corte:** 2026-11-10 · **Rama:** `feature/avance-final` → `main`
> **Requerimientos:** los de la propuesta aprobada (Entregable 1), con su numeración original.
> **Evidencia automática:** GitHub Actions (`.github/workflows/ci.yml`) ejecuta en cada push
> **42 pruebas de tenant-api** (incluidas pruebas de integración con PostgreSQL real vía
> Testcontainers), **16 de platform-api** y **8 pruebas unitarias de tenant-ui**, además del lint y
> el build de ambas interfaces.
> **Datos demo:** `docker compose down -v && docker compose up --build -d`. Credenciales en el README.

**Estados:** *Finalizado* = implementado de extremo a extremo, integrado y demostrable con el
escenario indicado · *Parcial* = funciona una parte y se indica qué falta.

## 1. Requerimientos funcionales

| ID | Requerimiento | Estado | % | Evidencia (pantalla / endpoint + escenario) |
|---|---|---|---|---|
| RF-01 | Registrar un tenant indicando nombre, datos de contacto y subdominio. | Finalizado | 100 | platform-ui **Tenants → New Tenant** (nombre, código/subdominio, email, teléfono y dirección de contacto, primer ADMIN) y **Edit**; `POST`/`PUT /api/platform/tenants`. El código es una etiqueta DNS válida (validación en API y `CHECK` en BD, V5) y funciona como **subdominio real**: `http://demo.localhost:5173` muestra el comercio en la pantalla de ingreso (`GET /api/public/tenants/{codigo}`) y solo admite a sus usuarios. Escenario: crear `selectos` con contacto → abrir `selectos.localhost:5173` → ingresar con su ADMIN; un ADMIN de otro comercio es rechazado. Prueba `staffLoginFromASubdomain_onlyAdmitsThatTenantsUsers`. |
| RF-02 | Aprovisionar automáticamente el espacio de datos aislado del nuevo tenant. | Finalizado | 100 | El alta crea el tenant y su primer ADMIN en una transacción, sin DDL ni pasos manuales; el ADMIN opera de inmediato con su espacio vacío. |
| RF-03 | Suspender y reactivar un tenant desde Platform UI. | Finalizado | 100 | **Deactivate / Activate**; la suspensión corta al instante las sesiones del personal **y de los clientes del portal** (401 `TENANT_SUSPENDED`). |
| RF-04 | El administrador de comercio configura las reglas de acumulación de puntos. | Finalizado | 100 | **Programs** (puntos por dólar y compra mínima, varios programas por comercio). |
| RF-05 | Registrar clientes finales dentro de un tenant. | Finalizado | 100 | **Customers → New Customer**; email único por comercio. |
| RF-06 | Otorgar puntos a un cliente por una compra. | Finalizado | 100 | **Transactions → New Transaction**; puntos calculados en el servidor y registrados en el ledger. |
| RF-07 | Canjear puntos por un beneficio configurado. | Finalizado | 100 | **Redemptions → New Redemption**; valida saldo del programa y stock, con bloqueo optimista. |
| RF-08 | Autenticar usuarios y diferenciar permisos por rol (plataforma, comercio, cliente). | Finalizado | 100 | Los **tres tipos de actor** existen: PLATFORM_ADMIN (platform-ui, secreto propio), ADMIN/STAFF (tenant-ui) y **CUSTOMER** (portal del cliente). El ADMIN concede el acceso desde el perfil (**Portal access**); el cliente entra en `http://<codigo>.localhost:5173/portal/login` y ve saldo, nivel, saldo por programa, recompensas disponibles e historial. Un token de cliente solo sirve en `/api/portal/**` (403 en el resto) y uno del personal no entra al portal (403); revocar el acceso corta la sesión del cliente. Pruebas `CustomerPortalIntegrationTest` (8). |
| RF-09 | Registrar en una bitácora de auditoría cada otorgamiento, canje o ajuste de puntos. | Finalizado | 100 | **Audit Log** (ADMIN) y ajustes con motivo obligatorio; `points_movements` con autor. |
| RF-10 | Reportes básicos de puntos otorgados y canjeados para el administrador de comercio. | Finalizado | 100 | **Reports**: indicadores, series por día/mes, top clientes y recompensas, niveles, alertas de stock; exportación **CSV** y **reporte formal en PDF** (`GET /api/reports/export/report.pdf`, prueba de aislamiento incluida). Además, **Overview** en platform-ui: reporte de actividad de toda la plataforma, con CSV. |

**Avance global (promedio simple de RF-01 a RF-10): 100 %.**

## 2. Requerimientos no funcionales

| ID | Requerimiento | Estado | % | Evidencia |
|---|---|---|---|---|
| RNF-01 | Aislamiento de datos entre tenants. | Finalizado | 100 | Filtro por tenant del usuario o cliente autenticado en cada consulta; pruebas de aislamiento de reportes, PDF, bitácora y portal contra PostgreSQL real. |
| RNF-02 | HTTPS + autenticación JWT. | Parcial | 50 | JWT HS512 con secretos separados por plano y revalidación de usuario/cliente y tenant en cada petición. **HTTPS:** el entorno entregado es local (Docker en `localhost`); en un despliegue, TLS se termina en el proxy inverso (nginx) con un certificado del dominio. |
| RNF-03 | Acciones principales en 3 clics o menos. | Finalizado | 100 | Conteo de clics del Avance 1; nuevas acciones: exportar PDF (1), conceder acceso al portal (3), editar comercio (2). |
| RNF-04 | Ambiente reproducible con Docker. | Finalizado | 100 | `docker compose up --build -d` levanta 5 contenedores, aplica V1–V5 y siembra los datos demo; el README describe la instalación en 7 pasos. |
| RNF-05 | Arquitectura en capas + pruebas automatizadas. | Finalizado | 100 | controller → service → repository → entity/DTO; **66 pruebas automatizadas** (42 tenant-api, 16 platform-api, 8 frontend) ejecutadas por **CI en GitHub Actions** en cada push. |
| RNF-06 | Agregar tenants sin cambios estructurales. | Finalizado | 100 | Crear un comercio solo inserta filas; no hay DDL ni reinicios. |

## 3. Cambios respecto a la propuesta

| Propuesta | Implementado | Justificación |
|---|---|---|
| Aislamiento schema-per-tenant | Esquema compartido con `tenant_id` | Una sola migración para todos los comercios y alta sin DDL (RNF-06); aislamiento probado con PostgreSQL real. |
| Keycloak | JWT propio con secretos por plano y token de cliente con alcance propio | Riesgo identificado en la propuesta; se priorizó el aislamiento y los tres roles quedaron implementados sin un servicio adicional. |
| Java 21 | Java 17 | Versión del proyecto heredado. |
| HTTPS | Pendiente para despliegue | Se resuelve en el proxy inverso del servidor; no aplica al entorno local de evaluación. |
