# Auditoría de Lógica de Negocio — SIFIPRO (Dominio de Fidelización)

Fecha: 2026-08-29
Alcance: acumulación de puntos, canje de recompensas, validaciones de negocio, auditoría/trazabilidad de operaciones, separación controller/servicio.
Método: revisión estática de código fuente (sin ejecutar, sin modificar nada).

---

## 1. Qué existe y funciona

### Acumulación de puntos (compras)
Implementada en [transaction/service/PurchaseTransactionServiceImpl.java](../../sifipro-backend/src/main/java/com/puent/sifipro/transaction/service/PurchaseTransactionServiceImpl.java), método `createPurchaseTransaction()`:
1. Resuelve el tenant del usuario autenticado y valida que `Customer` y `ProgramConfig` pertenezcan a ese tenant (`findCustomerByIdAndTenantId`, `findProgramByIdAndTenantId`).
2. Valida que el cliente esté activo y el programa esté activo (`BusinessException` si no).
3. Calcula puntos con `calculatePointsEarned(amount, minimumPurchaseAmount, pointsPerDollar)`: si `amount < minimumPurchaseAmount` devuelve `0`; si no, `amount * pointsPerDollar` redondeado a 4 decimales (`HALF_UP`).
4. Persiste la `PurchaseTransaction`.
5. Si `pointsEarned > 0`, actualiza `Customer.pointsBalance` (suma) y crea un registro `PointsMovement` tipo `EARN` enlazado a la transacción (`referenceType = "PURCHASE_TRANSACTION"`, `referenceId`).

### Canje de recompensas (redemption)
Implementado en [redemption/service/RedemptionServiceImpl.java](../../sifipro-backend/src/main/java/com/puent/sifipro/redemption/service/RedemptionServiceImpl.java), método `createRedemption()`:
1. Resuelve tenant, valida que `Customer` y `Reward` pertenezcan al tenant.
2. `validateRedemptionRules()` verifica: cliente activo, recompensa activa, stock disponible (`> 0`), y que el balance de puntos del cliente **en el programa de la recompensa** (calculado recorriendo el ledger `PointsMovement`, no leyendo `Customer.pointsBalance` directamente) sea suficiente.
3. Si todo es válido: crea `Redemption` (estado `COMPLETED`), descuenta `pointsUsed` de `Customer.pointsBalance`, decrementa `Reward.stock` en 1, y crea un `PointsMovement` tipo `REDEEM` (con puntos negativos) enlazado (`referenceType = "REDEMPTION"`).

### Separación de responsabilidades (controller vs. servicio)
La lógica de negocio está **bien separada de los controllers**. Ambos controllers (`PurchaseTransactionController`, `RedemptionController`) son delgados: solo validan el DTO de entrada (`@Valid`), extraen el email del `Authentication` y delegan al servicio; no contienen ninguna regla de negocio. Toda la lógica (cálculo de puntos, validaciones de elegibilidad, actualización de balances, creación de movimientos) vive en `*ServiceImpl`, siguiendo el mismo patrón consistente que el resto del backend (controller → service → repository).

### Validaciones de entrada (nivel DTO)
`CreatePurchaseTransactionRequest` y `CreateRedemptionRequest` usan Bean Validation (`@NotNull`, `@Positive`, `@Size`) para rechazar payloads estructuralmente inválidos (montos negativos o nulos, IDs faltantes) antes de llegar al servicio — capturado por `GlobalExceptionHandler.handleValidationException()` con `400 Bad Request` y detalle por campo.

### Ledger de movimientos de puntos (trazabilidad del dominio)
`points_movements` ([transaction/entity/PointsMovement.java](../../sifipro-backend/src/main/java/com/puent/sifipro/transaction/entity/PointsMovement.java)) actúa como un ledger apend-only: cada `EARN`/`REDEEM` queda registrado con tipo, monto, tenant, programa, cliente, referencia a la operación origen (`referenceType` + `referenceId`) y timestamp de auditoría heredado de `BaseEntity` (`createdAt`). Esto permite reconstruir el historial e incluso recalcular el balance de un cliente en un programa específico de forma independiente del campo denormalizado `Customer.pointsBalance` (de hecho `RedemptionServiceImpl.calculateProgramBalance()` hace exactamente eso para validar el canje).
El enum `PointsMovementType` contempla también `ADJUSTMENT` y `EXPIRE`, aunque **ningún flujo actual los genera** (ver sección 3).

### Manejo de errores de negocio
`BusinessException` (runtime, sin dependencias de framework) se usa consistentemente para reglas violadas (stock agotado, puntos insuficientes, entidad inactiva, duplicados) y se traduce a `400 Bad Request` de forma uniforme vía `GlobalExceptionHandler`. `IllegalArgumentException` (lanzada por `Customer.setPointsBalance()` si el valor es negativo) también se captura y responde con `400`.

### Transaccionalidad declarativa
Ambos métodos de escritura (`createPurchaseTransaction`, `createRedemption`) están anotados `@Transactional`, por lo que la escritura de la transacción/canje + actualización de balance + decremento de stock + inserción del `PointsMovement` ocurre de forma atómica (todo o nada) dentro de una única transacción de base de datos — si algo falla a mitad de camino, Spring hace rollback completo.

---

## 2. Qué existe pero está roto o incompleto

### 🔴 Condición de carrera real en canjes concurrentes (sobreventa de stock y de puntos)
Ni `Reward.stock` ni `Customer.pointsBalance` tienen control de concurrencia:
- No hay `@Version` (optimistic locking) en ninguna entidad del dominio.
- No hay `@Lock(PESSIMISTIC_WRITE)` en ningún método de repositorio (confirmado: cero coincidencias de `Lock`/`@Version`/`synchronized` en todo `src/main/java`).
- `@Transactional` por sí solo **no** previene esta condición de carrera: con el nivel de aislamiento por defecto de PostgreSQL/Hibernate (`READ_COMMITTED`), dos solicitudes de canje concurrentes sobre el **mismo** `Reward` o el **mismo** `Customer` pueden leer el mismo `stock` (p. ej. `stock = 1`) y el mismo `pointsBalance` en transacciones paralelas, pasar ambas la validación (`stock > 0`, `balance >= requiredPoints`), y ambas hacer `stock - 1` y `balance - pointsUsed` de forma independiente — resultando en `stock = -1` (sobreventa) o un balance negativo real en la práctica, pese a que `Customer.setPointsBalance()` valida `>= 0` **en memoria** (esa validación no ve el estado concurrente de la otra transacción, solo el valor que la transacción propia calculó).
- Esto es especialmente explotable en `POST /api/redemptions`, ya que el endpoint está disponible para `STAFF` y no tiene ningún límite de frecuencia; dos peticiones simultáneas desde el mismo cliente/dispositivo (doble clic, reintento de red) ya bastan para disparar el problema, sin necesidad de un ataque deliberado.
- Mismo riesgo, con menor probabilidad de explotación práctica, en `createPurchaseTransaction` si dos compras del mismo cliente se registran en paralelo (ambas leen el mismo `pointsBalance` inicial y sus incrementos podrían pisarse — "lost update").

### Balance de puntos es global, pero la elegibilidad de canje es por programa — inconsistencia de modelo
`Customer.pointsBalance` es un único campo denormalizado que se incrementa/decrementa **sin distinguir programa de fidelización** (una compra en el Programa A y una compra en el Programa B suman al mismo total). Sin embargo, `RedemptionServiceImpl.validateRedemptionRules()` valida la elegibilidad del canje usando `calculateProgramBalance()`, que recalcula el balance **filtrado por programa** recorriendo el ledger de `PointsMovement`. Consecuencia:
- Un cliente puede tener `pointsBalance = 1000` (con 800 ganados en el Programa A y 200 en el Programa B) y el sistema correctamente le **niega** un canje de 500 en el Programa B (balance real en ese programa: 200) — la validación de negocio es correcta.
- Pero el campo `Customer.pointsBalance` mostrado en toda la UI/API (`CustomerResponse`, `CustomerProfileResponse`, tier del cliente, ranking de "top customers") sigue siendo el total global, no desglosado por programa. Esto puede confundir al usuario (ve "1000 puntos disponibles" pero no puede canjear una recompensa de 500) y hace que el cálculo de **tier** (`CustomerTier.fromPoints`) y los reportes de "top customers" mezclen puntos de programas distintos como si fueran fungibles entre sí, cuando la propia lógica de canje los trata como aislados por programa. Es una inconsistencia de diseño del dominio, no un bug de ejecución.

### `Reward.stock` puede llegar a `0` sin desactivarse automáticamente
Cuando `reward.getStock() - 1` llega a `0`, la recompensa permanece con `active = true`. La siguiente solicitud de canje sí es rechazada correctamente por `validateRedemptionRules()` (`stock <= 0` → `BusinessException`), así que no hay bug funcional, pero no hay ninguna notificación, evento, ni flag automático — el `ADMIN` debe darse cuenta manualmente y desactivar la recompensa o reponer stock; no hay endpoint para "reponer stock" tampoco (`UpdateRewardRequest` permite cambiar `stock` directamente vía `PUT`, ver sección 3).

### Sin invariante de fecha de negocio en `transactionDate`/`redemptionDate`
`CreatePurchaseTransactionRequest.transactionDate` y `CreateRedemptionRequest.redemptionDate` solo se validan como `@NotNull` — no hay validación de que no sean fechas futuras ni fechas anteriores a la creación del cliente/programa. Un cliente STAFF podría registrar una compra o canje con fecha arbitraria (pasada o futura), lo que además **rompe el orden cronológico usado para el balance corriente** (`CustomerProfileServiceImpl.getPointsHistory()` construye `runningBalance` iterando movimientos por `id` ascendente, no por `transactionDate`/`redemptionDate`) — si se inserta una operación "atrasada" fuera de orden de creación, el gráfico de balance histórico mostrado al usuario no reflejará el orden cronológico real de negocio, solo el orden de inserción en la base.

### Reglas de negocio hardcodeadas (umbrales de tier)
Los umbrales de tier `BRONZE`/`SILVER` (500 pts) / `GOLD` (2000 pts) están hardcodeados como constantes en [customer/CustomerTier.java](../../sifipro-backend/src/main/java/com/puent/sifipro/customer/CustomerTier.java) (`SILVER_THRESHOLD`, `GOLD_THRESHOLD`), iguales para **todos los tenants**, sin posibilidad de configuración por tenant o por programa — a diferencia de `pointsPerDollar` y `minimumPurchaseAmount`, que sí son configurables por `ProgramConfig`. Si dos tenants con negocios de escala muy distinta (p. ej. cafetería vs. concesionario de autos) usan el sistema, ambos comparten los mismos umbrales de tier sin forma de ajustarlos desde la API.

### `PointsMovementType.ADJUSTMENT` y `EXPIRE` son código muerto
El enum contempla ajustes manuales de puntos y expiración de puntos, y de hecho `RedemptionServiceImpl.calculateProgramBalance()` y `CustomerProfileServiceImpl.buildPointsHistory()` ya tienen lógica para restar puntos cuando el tipo es `EXPIRE` — pero **no existe ningún flujo, servicio, ni job programado que genere movimientos `ADJUSTMENT` o `EXPIRE`**. Es una funcionalidad de negocio a medias: el modelo de datos y parte de la lógica de cálculo están preparados, pero no hay forma de que un `ADMIN` haga un ajuste manual de puntos, ni ningún mecanismo de expiración automática de puntos acumulados.

---

## 3. Qué falta por completo

### No hay expiración de puntos
Pese a que el ledger contempla `EXPIRE` como tipo de movimiento, no existe ningún job/scheduler (`@Scheduled`), ni lógica en ningún servicio, que expire puntos con antigüedad. Los puntos acumulados son indefinidos en la práctica.

### No hay ajuste manual de puntos (corrección de errores)
No existe ningún endpoint (`POST /api/transactions/adjustments` o similar) que permita a un `ADMIN` sumar/restar puntos manualmente a un cliente (p. ej. para corregir un error de captura, compensar una queja, etc.). Hoy la única forma de modificar `pointsBalance` es a través de una compra o un canje real.

### No hay cancelación/reversa de canjes ni de transacciones
`RedemptionStatus` contempla `CANCELLED` como valor posible, pero **no existe ningún endpoint ni método de servicio que transicione una `Redemption` de `COMPLETED` a `CANCELLED`**. Tampoco existe forma de anular una `PurchaseTransaction` ya registrada (por ejemplo, ante una devolución de producto) — no hay reversión de puntos ganados ni movimiento de tipo "reversal". Los DTOs de actualización de transacciones/canjes no existen; solo hay creación y lectura.

### No hay límites ni reglas anti-fraude
No hay validación de límites de puntos por transacción, límite de canjes por día/cliente, ni ninguna heurística de detección de abuso (por ejemplo, un `STAFF` registrando compras ficticias repetidamente para acumular puntos y canjearlos).

### No hay auditoría de **quién** ejecutó cada operación
El ledger (`PointsMovement`) y las entidades (`PurchaseTransaction`, `Redemption`) registran **qué** ocurrió, cuándo (`createdAt`) y a **qué tenant/cliente/programa** pertenece — pero **no registran qué usuario interno (`AppUser`) ejecutó la operación**. Ni `PurchaseTransaction` ni `Redemption` ni `PointsMovement` tienen una columna `created_by`/`performed_by`. Esto significa que, si un `STAFF` registra transacciones fraudulentas o comete un error, no hay forma de auditar después quién lo hizo — solo se sabe que ocurrió dentro del tenant. Esta es la brecha de auditoría más relevante del dominio.

### No hay eventos de dominio ni notificaciones
No hay ningún mecanismo de eventos (Spring `ApplicationEventPublisher`, colas, webhooks) que notifique cuando un cliente sube de tier, cuando una recompensa se queda sin stock, o cuando se completa un canje — cualquier integración futura (email, notificación push, webhook a un sistema externo) tendría que construirse desde cero.

### No hay tests automatizados de estas reglas
Como se documentó en la auditoría de backend ([02-backend.md](02-backend.md)), la única prueba existente es el test de contexto de Spring Boot. No hay ningún test unitario o de integración que verifique el cálculo de puntos, el rechazo de canjes con stock/puntos insuficientes, ni — más crítico aún — que reproduzca la condición de carrera descrita en la sección 2. Esa condición de carrera es exactamente el tipo de defecto que solo aparece bajo concurrencia real y que un test de carga o un test de integración con hilos concurrentes habría expuesto antes de producción.

---

## Resumen de riesgos por severidad

| Riesgo | Severidad | Ubicación |
|---|---|---|
| Condición de carrera en canje (sobreventa de stock / balance negativo real) | 🔴 Alto | [RedemptionServiceImpl.java](../../sifipro-backend/src/main/java/com/puent/sifipro/redemption/service/RedemptionServiceImpl.java) — sin `@Version` ni locking |
| Sin auditoría de qué usuario ejecutó cada transacción/canje | 🔴 Alto | `PurchaseTransaction`, `Redemption`, `PointsMovement` — sin columna `created_by` |
| Balance global vs. elegibilidad por programa (inconsistencia de modelo) | 🟠 Medio | `Customer.pointsBalance` vs. `calculateProgramBalance()` |
| Sin cancelación/reversa de canjes o compras | 🟠 Medio | Falta funcionalidad completa |
| Sin expiración ni ajuste manual de puntos (`ADJUSTMENT`/`EXPIRE` sin implementar) | 🟠 Medio | `PointsMovementType` — código muerto parcial |
| Umbrales de tier hardcodeados globalmente (no configurables por tenant) | 🟡 Bajo | [CustomerTier.java](../../sifipro-backend/src/main/java/com/puent/sifipro/customer/CustomerTier.java) |
| Sin validación de fechas de negocio en transacciones/canjes | 🟡 Bajo | DTOs de creación — solo `@NotNull` |
| Sin límites anti-fraude ni rate limiting en operaciones de puntos | 🟡 Bajo | Todo el dominio |
