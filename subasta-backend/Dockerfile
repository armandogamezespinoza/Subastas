# Etapa de compilación con Java 21
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Cacheo de dependencias de Maven
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Compilación de la aplicación
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Etapa de ejecución con Java 21 JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# SEGURIDAD VULN-04: Ejecución con usuario sin privilegios (no-root) y su-exec para gestionar volumen montado
RUN apk add --no-cache su-exec && \
    addgroup -S appgroup -g 1001 && \
    adduser -S appuser -u 1001 -G appgroup && \
    mkdir -p /app/uploads && chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/target/*.jar app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV UPLOAD_DIR=/app/uploads
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx320m -XX:+UseSerialGC"

EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
