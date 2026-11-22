# Auditoría Integral de Seguridad — Reporte Final
**Repositorio:** `DesarrolloSubasta`  
**Entorno auditado:** Java 21 + Spring Boot 3.3.4, PostgreSQL 15, Vanilla JS + HTML5, Nginx Alpine, Docker Compose  
**Objetivo de Despliegue:** Oracle Cloud Infrastructure (OCI) Ampere A1  
**Fecha:** 15 de Noviembre de 2026  
**Rama de trabajo:** `audit/security-and-production-readiness`  
**Estado:** Remedición verificada mediante pruebas unitarias, integración y análisis dinámico en contenedores.

---

## 1. Resumen Ejecutivo y Alcance

La presente auditoría integral evaluó el código fuente, la arquitectura de autenticación y autorización, el flujo criptográfico de tokens y códigos temporales, el manejo de documentos binarios, la capa de persistencia en PostgreSQL, la configuración de contenedores Docker y proxy inverso Nginx, así como la seguridad de frontend y dependencias.

### Alcance de las comprobaciones
- **Análisis estático de código:** Backend Spring Boot y Frontend Vanilla JS.
- **Auditoría de autenticación y autorización:** RBAC, JWT, flujo OTP, protección BOLA/IDOR.
- **Inspección de almacenamiento y archivos:** Sanitización de rutas (Path Traversal), validación por Magic Bytes con Apache Tika.
- **Infraestructura de red y contenedores:** Aislamiento de puertos en Docker Compose, ejecución como usuario no-root, healthchecks, dependencias condicionales y Nginx hardening.
- **Pruebas dinámicas ejecutadas:** Pruebas automatizadas en backend (`mvnw test`, 20 tests exitosos), pruebas unitarias en frontend (`vitest run`, 74 tests exitosos) y pruebas dinámicas HTTP directas contra los servicios orquestados en Docker.

---

## 2. Matriz Consolidada de Hallazgos

| ID | Hallazgo | Severidad Inicial | Categoría | Estado Remediación |
|---|---|---|---|---|
| **SEC-01** | BOLA / IDOR en visualización y descarga de expedientes de identidad | **CRÍTICA** | Spring Security / Autorización | **CORREGIDO** |
| **SEC-02** | Exposición de hash OTP en JWT y fuerza bruta offline sin límite de intentos | **CRÍTICA** | Criptografía / Autenticación | **CORREGIDO** |
| **SEC-03** | Secretos reales de SMTP (Gmail) y JWT en historial de Git y archivos | **CRÍTICA** | Gestión de Secretos | **PENDIENTE (Rotación Externa Requerida)** |
| **SEC-04** | Exposición pública de PostgreSQL (5432) y uso de superusuario `postgres` | **CRÍTICA** | Base de Datos / Docker | **CORREGIDO** |
| **SEC-05** | CORS permisivo (`*`) combinado con `AllowCredentials(true)` y Clickjacking | **ALTA** | Spring Security / CORS | **CORREGIDO** |
| **SEC-06** | Generación de usuario y contraseña temporal en memoria ("Using generated security password") | **ALTA** | Spring Boot Security | **CORREGIDO** |
| **SEC-07** | Ausencia de validación de Magic Bytes y riesgo de subida de ejecutables camuflados | **ALTA** | Almacenamiento de Archivos | **CORREGIDO** |
| **SEC-08** | Riesgo de Path Traversal en resolución de archivos de documentos | **ALTA** | Almacenamiento de Archivos | **CORREGIDO** |
| **SEC-09** | Falta de Rate Limiting y Cooldown en endpoint de emisión de OTP (`/send-code`) | **ALTA** | Autenticación / DoS | **CORREGIDO** |
| **SEC-10** | Contenedor backend ejecutándose como `root` y fallo de permisos de volumen | **ALTA** | Docker Hardening | **CORREGIDO** |
| **SEC-11** | Comparación de contraseñas en texto claro como fallback en autenticación | **ALTA** | Autenticación | **CORREGIDO** |
| **SEC-12** | Ausencia de Healthchecks y dependencias no sincronizadas (Riesgo 502 Bad Gateway) | **MEDIA** | Docker Compose / Nginx | **CORREGIDO** |
| **SEC-13** | Exposición de archivos de configuración (.json, .lock, .md) a través de Nginx | **MEDIA** | Nginx Proxy | **CORREGIDO** |
| **SEC-14** | Fuga potencial de stack traces en errores y excepciones no controladas | **MEDIA** | Manejo de Excepciones | **CORREGIDO** |
| **SEC-15** | Uso de `hibernate.ddl-auto=update` en lugar de migraciones controladas | **MEDIA** | PostgreSQL / Hibernate | **PENDIENTE (Riesgo Residual / Recomendación)** |

---

## 3. Detalle de Hallazgos y Remediaciones

### SEC-01 — BOLA / IDOR en Documentos Confidenciales
- **Severidad:** CRÍTICA (CVSS: 9.1)
- **Evidencia:** La regla de seguridad en `SecurityConfig.java` permitía acceso irrestricto a `/api/v1/revision/documentos/**`. Cualquier persona sin iniciar sesión podía enumerar identificadores numéricos y descargar identificaciones oficiales (INE), CURP y estados de cuenta bancarios.
- **Archivos afectados:** `SecurityConfig.java`, `RevisionController.java`.
- **Riesgo:** Fuga masiva de datos personales altamente confidenciales y violación de normativas de privacidad.
- **Remediación:**
  1. Se eliminó la excepción pública en `SecurityConfig.java`, forzando autenticación obligatoria para `/api/v1/revision/documentos/**`.
  2. En `RevisionController.java`, se implementó validación a nivel de recurso (`isAuthorizedToAccessDocument`): los roles administrativos (`ADMINISTRADOR`, `APROBADOR`, `CONTROLER`) tienen acceso global; compradores y vendedores únicamente pueden acceder a los documentos asociados a su propia cuenta verificada en el token JWT.
  3. Todo intento de acceso cruzado no autorizado genera **HTTP 403 Forbidden**. Peticiones anónimas generan **HTTP 401 Unauthorized**.

### SEC-02 — Exposición de OTP en JWT y Vulnerabilidad Criptográfica
- **Severidad:** CRÍTICA (CVSS: 8.9)
- **Evidencia:** `/api/v1/auth/send-code` devolvía al navegador un JWT firmado que contenía el hash SHA-256 del código de verificación de 6 dígitos. Dado el número reducido de combinaciones (1,000,000) y la clave fija, era posible descifrar el código localmente mediante fuerza bruta offline en milisegundos sin acceder a la cuenta de correo.
- **Archivos afectados:** `JwtService.java`, `AuthController.java`, `VerificationCodeService.java`.
- **Riesgo:** Suplantación de identidad en registros y validación fraudulenta de correos electrónicos.
- **Remediación:**
  1. Se eliminó el claim `codeHash` del token JWT `challengeToken`.
  2. Se diseñó el servicio en memoria `VerificationCodeService` que genera códigos de 6 dígitos con `SecureRandom`, los almacena asociados a un UUID `challengeId`, aplica expiración estricta de 10 minutos y bloquea el código tras 3 intentos fallidos.
  3. Se elimina el código inmediatamente tras el primer uso exitoso (prevención de Replay Attacks).

### SEC-03 — Exposición Histórica de Credenciales SMTP y Claves Criptográficas
- **Severidad:** CRÍTICA (CVSS: 8.8)
- **Evidencia:** En el commit `3700b1a93df7300cb293b665ef8e98f309b19b5b`, se incluyeron credenciales en texto plano dentro del archivo `subasta-backend/src/main/resources/application.yml` (contraseña de aplicación de Gmail para SMTP, secreto JWT y configuración de base de datos).
- **Archivos afectados:** `subasta-backend/src/main/resources/application.yml` (histórico de Git).
- **Riesgo:** Un atacante con acceso al historial de Git puede utilizar el buzón SMTP corporativo para enviar correos maliciosos o forjar tokens administrativos firmados.
- **Remediación y Acción Pendiente:**
  - El archivo `application.yml` fue eliminado del árbol de trabajo actual y reemplazado por variables de entorno obligatorias `${MAIL_USERNAME}`, `${MAIL_PASSWORD}` y `${JWT_SECRET}`.
  - **ACCIÓN HUMANA OBLIGATORIA:** La contraseña de aplicación de Gmail y el secreto JWT deben ser revocados y rotados en la cuenta de Google correspondiente antes de publicar la aplicación en OCI.

### SEC-04 — Exposición de PostgreSQL y Uso de Superusuario
- **Severidad:** CRÍTICA (CVSS: 8.5)
- **Evidencia:** En `docker-compose.yml`, el puerto `5432:5432` estaba publicado hacia todas las interfaces del host, y Spring Boot se conectaba directamente usando el superusuario `postgres`.
- **Archivos afectados:** `docker-compose.yml`, `docker/postgres/01-init-app-user.sh`.
- **Riesgo:** Exposición del motor de datos a ataques de fuerza bruta en Internet y escalada de privilegios a nivel de sistema operativo en caso de inyección SQL.
- **Remediación:**
  1. Se eliminó el mapeo de puertos públicos de PostgreSQL en `docker-compose.yml`. El servicio ahora únicamente escucha en la red privada interna `app-network`.
  2. Se creó el script de inicialización `01-init-app-user.sh` para crear un usuario de aplicación `subasta_app` con atributos `NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`.
  3. Se ajustaron los permisos sobre tablas y secuencias del esquema `public` para que pertenezcan y sean operables por `subasta_app`.
  4. Spring Boot se configuró para conectarse exclusivamente a través de `subasta_app`.

### SEC-05 — CORS Permisivo y Clickjacking
- **Severidad:** ALTA (CVSS: 7.4)
- **Evidencia:** `SecurityConfig.java` configuraba `setAllowedOriginPatterns(List.of("*"))` en conjunto con `setAllowCredentials(true)`. Además, los controladores `AuthController`, `OnboardingController` y `RevisionController` tenían la anotación `@CrossOrigin(origins = "*")`. Asimismo, se deshabilitaba `frameOptions`.
- **Archivos afectados:** `SecurityConfig.java`, controladores REST.
- **Riesgo:** Ataques de origen cruzado, robo de información de sesión y ataques de Clickjacking.
- **Remediación:**
  1. Se eliminaron las anotaciones `@CrossOrigin(origins = "*")` en todos los controladores para centralizar la política en `SecurityConfig`.
  2. Se configuró `corsConfigurationSource` dinámico gobernado por la propiedad `app.cors.allowed-origins` (con orígenes restringidos a dominios autorizados y sin comodines cuando hay credenciales).
  3. Se activó `frameOptions(frame -> frame.sameOrigin())` y `contentTypeOptions(Customizer.withDefaults())`.

### SEC-06 — Mensaje de Spring Security "Using generated security password"
- **Severidad:** ALTA (CVSS: 6.8)
- **Evidencia:** Al iniciar el backend, Spring Boot emitía en los logs: `Using generated security password: [UUID]`.
- **Causa Raíz:** Al no declarar un bean `UserDetailsService` o `AuthenticationManager` (dado que la aplicación implementa autenticación sin estado mediante `JwtFilter`), Spring Boot asume una configuración de seguridad incompleta y activa `UserDetailsServiceAutoConfiguration`, registrando un usuario en memoria con credenciales temporales.
- **Riesgo:** Contaminación de logs con contraseñas efímeras y existencia de una superficie de autenticación residual en memoria que podría ser explotada si se expusieran endpoints predeterminados de Spring o Actuator.
- **Remediación:** Se excluyó explícitamente la autoconfiguración en `SubastaApplication.java`:
  ```java
  @SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
  ```
  El mensaje desapareció por completo y la autenticación se mantiene delegada exclusivamente al pipeline de JWT y control de acceso.

### SEC-07 — Inspección de Magic Bytes con Apache Tika en Subida de Documentos
- **Severidad:** ALTA (CVSS: 7.8)
- **Evidencia:** La subida de archivos confiaba ciegamente en el nombre original del cliente sin validar contenido binario real ni extensiones, permitiendo subir ejecutables (`.exe`), scripts (`.sh`, `.php`) camuflados como `.pdf`.
- **Archivos afectados:** `pom.xml`, `FileValidationService.java`, `FileStorageService.java`, `OnboardingController.java`.
- **Riesgo:** Ejecución remota de código en el servidor, distribución de malware a través de los expedientes de revisión y ataques XSS almacenado.
- **Remediación:**
  1. Se implementó `FileValidationService` utilizando `org.apache.tika.Tika` para analizar la firma binaria (magic bytes) del flujo de bytes.
  2. Se impuso una lista blanca estricta de extensiones (`.pdf`, `.jpg`, `.jpeg`, `.png`) y tipos MIME (`application/pdf`, `image/jpeg`, `image/png`).
  3. Se integró la validación obligatoria en `FileStorageService.saveFile()`. Cualquier archivo que no coincida con su firma real es rechazado con **HTTP 415 Unsupported Media Type**.

### SEC-08 — Mitigación de Path Traversal en Manipulación de Archivos
- **Severidad:** ALTA (CVSS: 7.5)
- **Evidencia:** El método `FileStorageService.resolveFile` comprobaba si la ruta almacenada existía en el sistema de archivos (`Files.isRegularFile(path)`) sin verificar si se encontraba dentro de `uploadPath`.
- **Archivos afectados:** `FileStorageService.java`.
- **Riesgo:** Lectura arbitraria de archivos del sistema operativo (p. ej., `/etc/passwd`) si se manipulaba el registro en base de datos.
- **Remediación:** Se implementó normalización estricta de rutas con `Paths.get(storedPath).toAbsolutePath().normalize()` y se exige `candidate.startsWith(this.uploadPath)`. Toda ruta que intente escapar del directorio seguro es denegada retornando `null`.

### SEC-09 — Rate Limiting y Cooldown en Envío de OTP
- **Severidad:** ALTA (CVSS: 7.3)
- **Evidencia:** El endpoint `/api/v1/auth/send-code` no limitaba la frecuencia de envíos para un mismo correo electrónico, permitiendo saturar el buzón SMTP o realizar ataques de bombardeo de correo (Mail Bombing).
- **Archivos afectados:** `VerificationCodeService.java`, `AuthController.java`, `nginx.conf`.
- **Riesgo:** Agotamiento de cuota de correo SMTP, denegación de servicio por consumo de recursos y bloqueo de la IP por parte de Google/proveedores de correo.
- **Remediación:**
  1. En `VerificationCodeService`, se implementó un mecanismo de cooldown en memoria de 60 segundos por correo electrónico.
  2. Si se solicita un código antes de transcurrir 60 segundos, `AuthController` responde inmediatamente con **HTTP 429 Too Many Requests** indicando el tiempo restante.
  3. En Nginx se configuró la directiva `limit_req_zone` con zona de limitación para `/api/v1/auth/` con tasa de 10 peticiones por minuto.

### SEC-10 — Hardening de Contenedor Backend (Usuario No Privilegiado)
- **Severidad:** ALTA (CVSS: 7.2)
- **Evidencia:** El contenedor del backend se ejecutaba originalmente como `root`. Al intentar correr como usuario sin privilegios `appuser`, el volumen persistente montado `/app/uploads` generaba `AccessDeniedException` debido a que Docker crea los volúmenes con permisos `root:root`.
- **Archivos afectados:** `subasta-backend/Dockerfile`, `subasta-backend/docker-entrypoint.sh`.
- **Riesgo:** En caso de vulnerabilidad en la JVM o dependencias, un atacante obtendría acceso con privilegios de root en el contenedor.
- **Remediación:**
  1. Se creó `docker-entrypoint.sh` utilizando `su-exec` en Alpine.
  2. Al arrancar, el script asegura la propiedad de `/app/uploads` para `appuser:appgroup` y cede los privilegios inmediatamente mediante `exec su-exec appuser java -jar app.jar`.
  3. La JVM se ejecuta 100% bajo el usuario sin privilegios `appuser` (UID 1001).

### SEC-11 — Eliminación de Comparación de Contraseñas en Texto Plano
- **Severidad:** ALTA (CVSS: 7.0)
- **Evidencia:** En `AuthController.java`, existía una comprobación de respaldo: `if (!passwordMatches && password.equals(u.getPassword())) passwordMatches = true;`.
- **Archivos afectados:** `AuthController.java`.
- **Riesgo:** Admisión de contraseñas no cifradas en base de datos y violación del estándar criptográfico BCrypt.
- **Remediación:** Se eliminó la condición de respaldo. El sistema ahora exige que toda contraseña pase exclusivamente por `passwordEncoder.matches(...)` contra hashes BCrypt válidos.

### SEC-12 — Resiliencia en Docker Compose y Prevención de Errores 502
- **Severidad:** MEDIA (CVSS: 5.3)
- **Evidencia:** Las dependencias entre contenedores (`depends_on`) no evaluaban el estado de salud (`condition: service_healthy`). Backend intentaba conectarse a PostgreSQL antes de que estuviera listo, y Nginx enviaba peticiones al Tomcat mientras Spring Boot inicializaba, produciendo errores 502 Bad Gateway y reinicios cíclicos.
- **Archivos afectados:** `docker-compose.yml`, `HealthController.java`.
- **Riesgo:** Caídas del servicio en arranques y reinicios no supervisados en OCI.
- **Remediación:**
  1. Se creó el controlador `/api/v1/health` que responde HTTP 200 `{"status":"UP"}`.
  2. Se configuraron healthchecks nativos para PostgreSQL (`pg_isready`), Backend (`wget http://localhost:8080/api/v1/health`) y Frontend Nginx.
  3. Se vincularon las dependencias con `condition: service_healthy`.

### SEC-13 — Protección de Archivos Sensibles en Servidor Web Nginx
- **Severidad:** MEDIA (CVSS: 5.0)
- **Evidencia:** En la configuración original de Nginx, archivos estáticos como `package.json`, `.dockerignore` y archivos de documentación podían ser descargados si se solicitaban directamente por URL.
- **Archivos afectados:** `subasta-frontend/nginx.conf`.
- **Riesgo:** Divulgación de información sobre dependencias y versiones de librerías.
- **Remediación:** Se añadieron bloques de bloqueo en `nginx.conf` denegando el acceso con código 404 a extensiones sensibles (`.json`, `.lock`, `.yml`, `.yaml`, `.md`, `.dockerfile`) y archivos ocultos (`/\.`).

### SEC-14 — Sanitización de Errores con Manejador Global
- **Severidad:** MEDIA (CVSS: 4.8)
- **Evidencia:** Errores de validación, violaciones de tamaño de archivo o excepciones no capturadas podían exponer la página de error estándar de Tomcat con el stack trace completo.
- **Archivos afectados:** `subasta-backend/src/main/java/com/subasta/exception/GlobalExceptionHandler.java`.
- **Riesgo:** Fuga de nombres de clases internas, paquetes Java, versiones de frameworks y consultas SQL.
- **Remediación:** Se implementó `GlobalExceptionHandler` con `@RestControllerAdvice` capturando de forma tipada `MaxUploadSizeExceededException` (HTTP 413), `UnsupportedMediaTypeException` (HTTP 415), `IllegalArgumentException` (HTTP 400), `MethodArgumentNotValidException` (HTTP 400), `AccessDeniedException` (HTTP 403) y `Exception` genérica (HTTP 500) devolviendo mensajes estructurados en JSON sin detalles internos.

### SEC-15 — Uso de Hibernate `ddl-auto=update`
- **Severidad:** MEDIA (CVSS: 4.2)
- **Evidencia:** `application.properties` mantiene `spring.jpa.hibernate.ddl-auto=update`.
- **Riesgo:** Alteraciones de esquema no controladas en tiempo de arranque que pueden bloquear tablas o generar inconsistencias en un entorno de producción compartido.
- **Estado:** Pendiente / Recomendación para la siguiente etapa (adoptar Flyway o Liquibase y establecer `ddl-auto=validate`).

