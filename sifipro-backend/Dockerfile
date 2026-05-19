# ─────────────────────────────────────────────────────────────────────────────
#  SIFIPRO Backend – Spring Boot 17
#  Multi-stage build: compila con JDK, corre con JRE (imagen más liviana)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copiar Maven wrapper y pom.xml primero para cachear las dependencias.
# Si solo cambia el código fuente, esta capa no se reconstruye.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Arreglar line endings (CRLF → LF) por si el archivo fue editado en Windows
RUN chmod +x mvnw && sed -i 's/\r$//' mvnw

# Descargar todas las dependencias (cacheadas en esta capa)
RUN ./mvnw dependency:go-offline -B --no-transfer-progress

# Copiar el código fuente y compilar
COPY src ./src
RUN ./mvnw package -DskipTests -B --no-transfer-progress

# ── Stage 2: Runtime ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Usuario no-root por buenas prácticas de seguridad
RUN addgroup -S sifipro && adduser -S sifipro -G sifipro

COPY --from=build /app/target/*.jar app.jar
RUN chown sifipro:sifipro app.jar

USER sifipro
EXPOSE 8081

# -Djava.security.egd mejora la velocidad de arranque en Linux
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
