# Cambios de la entrega final — SIFIPRO

Rama `feature/avance-final`, a partir de `main` después del Avance 1 (92.5 %). Objetivo: cerrar
los requerimientos que quedaron parciales (RF-01 y RF-08), completar los reportes y automatizar
la verificación (RNF-05).

## 1. Qué se agregó

| Área | Cambio | Requerimiento |
|---|---|---|
| Base de datos | `V5`: contacto del comercio (`contact_email`, `contact_phone`, `address`), `CHECK` del código como etiqueta DNS y acceso al portal del cliente (`portal_password_hash`, `portal_last_login_at`). Todo aditivo y nullable: las bases existentes migran sin pasos manuales. | RF-01, RF-08 |
| platform-api | Alta con datos de contacto y validación del código/subdominio; edición del comercio (`PUT /api/platform/tenants/{id}`); reporte de la plataforma (`GET /api/platform/metrics`). | RF-01, RF-10 |
| platform-ui | **Overview** (indicadores, ventas de 6 meses, actividad por comercio, CSV); **Tenants** con contacto, enlace al subdominio y edición. | RF-01, RF-10 |
| tenant-api | Portal del cliente (`/api/portal/**`) con token de alcance `CUSTOMER`, filtro de seguridad propio y revalidación en cada petición; acceso concedido/revocado por el ADMIN; login del personal restringido al comercio del subdominio; resolución pública del comercio por subdominio; **reporte PDF**. | RF-01, RF-08, RF-10 |
| tenant-ui | Pantalla de ingreso identificada por subdominio; **portal del cliente** (`/portal`); botón **Portal access** en el perfil; botón **Export PDF report**. | RF-01, RF-08, RF-10 |
| Calidad | GitHub Actions: pruebas de ambos backends con PostgreSQL de servicio y Testcontainers, lint, Vitest y build de ambas UIs; 8 pruebas de integración nuevas del portal, subdominio (incluido CORS) y PDF; 3 nuevas de platform-api. | RNF-05 |

## 2. Decisiones técnicas

- **Token de cliente separado del de personal.** El sujeto del token es `customer:{id}`, que nunca
  coincide con un email, así que el filtro del personal lo ignora; un filtro propio lo acepta solo
  en `/api/portal/**`. Toda otra ruta exige ADMIN o STAFF, de modo que un cliente no puede llegar a
  operaciones del comercio aunque tenga un token válido.
- **El subdominio decide el comercio.** Los correos de clientes son únicos por comercio, no
  globales: el portal necesita saber en qué comercio buscar, y lo toma del subdominio. Para el
  personal, el subdominio es una restricción adicional (mismo mensaje que una contraseña
  incorrecta, para no confirmar cuentas de otros comercios).
- **`*.localhost` como subdominio local.** Los navegadores resuelven cualquier `*.localhost` a la
  propia máquina, así que la demostración no requiere editar `hosts` ni DNS. En producción se usa
  un DNS comodín (`*.sifipro.com`) y el mismo código funciona sin cambios.
- **PDF generado en el servidor (OpenPDF).** Reutiliza exactamente los cálculos del módulo de
  reportes, así que el PDF siempre coincide con la pantalla y con el CSV.
- **Reporte de plataforma solo con agregados.** El equipo de SIFIPRO ve conteos y totales por
  comercio, nunca sus clientes o transacciones individuales.

## 3. Verificación

- **CI en verde** en cada commit de la rama: 42 pruebas de tenant-api, 16 de platform-api y 8 de
  tenant-ui, más lint y build de ambas UIs.
- **Escenario de demostración:** ver el README, sección *Flujo de prueba* (pasos 1 a 8).

## 4. Pendiente

- **HTTPS (RNF-02):** se configura en el proxy inverso al desplegar en un servidor con dominio.
- **Keycloak:** evolución posible del proveedor de identidad; no se requiere para los tres roles.
