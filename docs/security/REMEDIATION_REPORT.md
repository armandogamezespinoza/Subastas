# Reporte de Remediación Técnica y Verificación
**Proyecto:** Plataforma Subasta  
**Fecha de Remediación:** 15 de Noviembre de 2026  
**Rama de Trabajo:** `audit/security-and-production-readiness`  
**Estado:** **Remediado y Verificado al 100% en Pruebas Automatizadas y Contenedores**

---

## 1. Resumen de Acciones de Remediación

Se ejecutaron correcciones puntuales, defensivas y no destructivas sobre el código fuente, la infraestructura de contenedores y la configuración de servicios web. No se modificaron funcionalidades de negocio existentes ni se realizaron alteraciones estéticas en el frontend.

Todas las correcciones implementadas fueron validadas mediante pruebas automatizadas unitarias, de integración y pruebas dinámicas de penetración local sobre los contenedores Docker en ejecución.

---

## 2. Detalle de Correcciones Implementadas

### Remediación 1: Eliminación de IDOR y Protección Estricta de Expedientes
- **Componentes:** `SecurityConfig.java`, `RevisionController.java`.
- **Cambio Realizado:**
  - En `SecurityConfig.java`, la ruta `/api/v1/revision/documentos/**` fue removida de la lista blanca pública y configurada como `.authenticated()`.
  - En `RevisionController.java`, se implementó el método de validación `isAuthorizedToAccessDocument(Documento, Authentication)`.
  - Roles de supervisión (`ADMINISTRADOR`, `ADMIN`, `APROBADOR`, `CONTROLER`) tienen acceso completo.
  - Para usuarios regulares (`COMPRADOR`, `VENDEDOR`), se extrae el correo electrónico desde el JWT y se verifica coincidencia con el dueño del expediente en base de datos.
- **Justificación Técnica:** Principio de autorización a nivel de recurso (Object-Level Authorization) y defensa en profundidad contra BOLA/IDOR.
- **Pruebas y Resultados:**
  - `DocumentSecurityIdorTests`:
    - Petición sin token -> **HTTP 401 Unauthorized** (Pass).
    - Petición con token de usuario atacante ajeno -> **HTTP 403 Forbidden** (Pass).
    - Petición de usuario legítimo propietario -> **HTTP 200 OK** (Pass).
    - Petición con rol APROBADOR/ADMINISTRADOR -> **HTTP 200 OK** (Pass).

---

### Remediación 2: Rediseño Criptográfico de OTP (Anti-Brute Force Offline)
- **Componentes:** `VerificationCodeService.java` (Nuevo), `JwtService.java`, `AuthController.java`.
- **Cambio Realizado:**
  - Se eliminó el campo `codeHash` de la carga útil del JWT emitido al cliente en `/api/v1/auth/send-code`.
  - Se creó el servicio `VerificationCodeService` que genera números aleatorios seguros de 6 dígitos mediante `SecureRandom`.
  - El código se almacena en memoria vinculado a un identificador efímero `challengeId` UUID con tiempo de vida estricto de 10 minutos.
  - Se estableció un contador de intentos fallidos: al 3er fallo se revoca y elimina automáticamente el código.
  - Al validarse con éxito, el código se borra inmediatamente de memoria (prevención de ataques de repetición).
- **Justificación Técnica:** Impide que un atacante extraiga el token de desafío y descifre el código mediante fuerza bruta fuera de línea sin acceso al buzón de correo.
- **Pruebas y Resultados:**
  - `OtpSecurityTests`:
    - Verificación de ausencia de `codeHash` en el payload JWT decodificado (Pass).
    - Bloqueo de código tras 3 intentos fallidos consecutivos (Pass).
    - Verificación exitosa con código correcto e invalidación inmediata ante reintento (Pass).

---

### Remediación 3: Prevención de Abuso de Envío de Correo (Rate Limiting y Cooldown)
- **Componentes:** `VerificationCodeService.java`, `AuthController.java`, `nginx.conf`.
- **Cambio Realizado:**
  - En `VerificationCodeService`, se agregó un mapa concurrente de cooldown de 60 segundos por correo electrónico.
  - En `AuthController.java`, se valida si el correo solicitante se encuentra en periodo de enfriamiento antes de invocar a `emailService.sendVerificationCode`.
  - Ante solicitudes repetidas dentro del intervalo de 60 segundos, se responde con **HTTP 429 Too Many Requests**.
  - En `nginx.conf`, se declaró `limit_req_zone` con límite de 10 peticiones por minuto para la ruta `/api/v1/auth/`.
- **Justificación Técnica:** Mitiga ataques de denegación de servicio por agotamiento de recursos SMTP, previene bloqueo de reputación IP del servidor y bombardeo de correos a usuarios no consentidos.
- **Pruebas y Resultados:**
  - `FileAndInfrastructureSecurityTests.testSendCodeRateLimitingCooldown`: Primera solicitud retorna HTTP 200, segunda solicitud inmediata retorna **HTTP 429** con mensaje descriptivo (Pass).

---

### Remediación 4: Inspección de Magic Bytes con Apache Tika y Prevención de Path Traversal
- **Componentes:** `subasta-backend/pom.xml`, `FileValidationService.java` (Nuevo), `FileStorageService.java`, `UnsupportedMediaTypeException.java` (Nuevo).
- **Cambio Realizado:**
  - Se añadió `tika-core` versión `2.9.0` al proyecto Maven.
  - `FileValidationService` realiza inspección de los primeros bytes del archivo (magic bytes) para determinar el tipo MIME real independientemente de la extensión.
  - Se permiten únicamente: `application/pdf`, `image/jpeg` y `image/png`. Archivos ejecutables o scripts son denegados con **HTTP 415 Unsupported Media Type**.
  - En `FileStorageService.resolveFile()`, se implementó normalización absoluta con `path.toAbsolutePath().normalize()` y comprobación estricta de prefijo `candidate.startsWith(this.uploadPath)`. Rutas con secuencias `../` o que intenten acceder fuera de `/app/uploads` devuelven `null`.
- **Justificación Técnica:** Prevención de ejecución de código remoto (RCE), subida de scripts maliciosos y divulgación arbitraria de archivos del sistema operativo mediante Path Traversal.
- **Pruebas y Resultados:**
  - `FileAndInfrastructureSecurityTests`:
    - Rechazo de archivo `.exe` por extensión no permitida (Pass).
    - Rechazo de archivo de texto/script renombrado a `.pdf` por detección Tika (Pass).
    - Aceptación y almacenamiento de PDF con firma válida `%PDF-` (Pass).
    - Bloqueo de peticiones de Path Traversal hacia `/etc/passwd` y `../../etc/shadow` (Pass).
  - Prueba dinámica contra contenedor: Subida de `exploit.exe` respondió **HTTP 415**. Subida de `fake_curp.pdf` (contenido de texto plano) respondió **HTTP 415**. Subida de PDF legítimo respondió **HTTP 200**.

---

### Remediación 5: Resolución del Warning "Using generated security password"
- **Componentes:** `SubastaApplication.java`.
- **Cambio Realizado:**
  - Se excluyó la clase de autoconfiguración de Spring Security:
    ```java
    @SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
    ```
- **Justificación Técnica:** Dado que la aplicación utiliza autenticación sin estado gobernada por tokens JWT y un controlador REST personalizado, la autoconfiguración por defecto de usuarios en memoria de Spring Boot era innecesaria, contaminaba los logs del sistema y creaba una cuenta temporal redundante.
- **Pruebas y Resultados:**
  - Al ejecutar `mvnw test` y levantar la aplicación en Docker, el mensaje `Using generated security password` desapareció completamente de los logs de arranque.

---

### Remediación 6: Fortalecimiento de Autenticación y Criptografía de Contraseñas
- **Componentes:** `AuthController.java`.
- **Cambio Realizado:**
  - Se eliminó el bloque que admitía contraseñas en texto claro si no coincidía el hash BCrypt:
    ```java
    // BLOQUE INSEGURO REMOVIDO:
    // if (!passwordMatches && password.equals(u.getPassword())) passwordMatches = true;
    ```
  - Se dejó exclusivamente la verificación contra hash mediante `passwordEncoder.matches(password, u.getPassword())`.
- **Justificación Técnica:** Garantiza que bajo ninguna circunstancia se acepten contraseñas en texto plano, obligando a que toda credencial almacenada en base de datos cumpla con el estándar de hash seguro BCrypt.
- **Pruebas y Resultados:**
  - `AuthAndRevisionFlowTests`: Validación de login con contraseñas encriptadas con BCrypt y rechazo inmediato de credenciales inválidas (Pass).

---

### Remediación 7: Hardening de CORS y Cabeceras de Seguridad
- **Componentes:** `SecurityConfig.java`, `AuthController.java`, `OnboardingController.java`, `RevisionController.java`.
- **Cambio Realizado:**
  - Se removió `@CrossOrigin(origins = "*")` de todos los controladores.
  - En `SecurityConfig.java`, se configuró `corsConfigurationSource()` parametrizado mediante la propiedad `app.cors.allowed-origins`. Si se especifica una lista blanca de orígenes (por ejemplo, `http://localhost,https://mi-dominio.com`), se permite `AllowCredentials(true)`; si se especifica `*`, se desactiva `AllowCredentials`.
  - Se añadieron las cabeceras `frameOptions(frame -> frame.sameOrigin())` y `contentTypeOptions()`.
- **Justificación Técnica:** Cumplimiento del estándar W3C CORS, mitigación de robo de sesión cross-origin y protección contra ataques de Clickjacking y MIME-sniffing.
- **Pruebas y Resultados:**
  - Verificación en respuestas HTTP: `X-Frame-Options: SAMEORIGIN` y `X-Content-Type-Options: nosniff` presentes en cada respuesta de la API (Pass).

---

### Remediación 8: Aislamiento de Red de PostgreSQL y Usuario de Mínimo Privilegio
- **Componentes:** `docker-compose.yml`, `docker/postgres/01-init-app-user.sh`, `application.properties`.
- **Cambio Realizado:**
  - Se retiró la directiva `ports: - "5432:5432"` en el servicio `postgres`. La base de datos solo es accesible dentro de la red interna Docker `app-network`.
  - Se implementó `01-init-app-user.sh` para crear el rol de aplicación `subasta_app` con atributos `NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`.
  - Se otorgaron privilegios de lectura y escritura (`ALL PRIVILEGES`) sobre las tablas y secuencias del esquema `public`, sin otorgar permisos administrativos sobre el motor.
  - Spring Boot se configuró para conectarse exclusivamente a través de las credenciales de `subasta_app`.
- **Justificación Técnica:** Principio de mínimo privilegio y reducción de superficie de ataque de la base de datos frente a Internet.
- **Pruebas y Resultados:**
  - Comprobación de conectividad: Spring Boot interactúa correctamente con las tablas de PostgreSQL dentro del contenedor. El puerto 5432 no responde desde el exterior del host.

---

### Remediación 9: Ejecución de Contenedor Backend como No-Root con `su-exec`
- **Componentes:** `subasta-backend/Dockerfile`, `subasta-backend/docker-entrypoint.sh`.
- **Cambio Realizado:**
  - Se creó el usuario y grupo `appuser:appgroup` (UID/GID 1001) en la imagen Alpine.
  - Se creó el script de arranque `docker-entrypoint.sh` que asegura los permisos de `/app/uploads` en el volumen montado y cede los privilegios mediante `exec su-exec appuser java -jar app.jar`.
- **Justificación Técnica:** Los volúmenes montados en Docker son inicializados por el host como `root:root`. El script permite ajustar la propiedad del directorio persistente y ejecutar el proceso Java sin privilegios de superusuario, eliminando el riesgo de escalada de privilegios a nivel de host.
- **Pruebas y Resultados:**
  - Inspección del contenedor en tiempo de ejecución: `docker exec subasta_backend id` confirma `uid=1001(appuser) gid=1001(appgroup)`. Subida de documentos exitosa sin errores de acceso (Pass).

---

### Remediación 10: Sincronización de Contenedores con Healthchecks
- **Componentes:** `HealthController.java` (Nuevo), `SecurityConfig.java`, `docker-compose.yml`, `nginx.conf`.
- **Cambio Realizado:**
  - Se creó el endpoint ligero `/api/v1/health` que responde HTTP 200 `{"status":"UP"}` sin requerir autenticación.
  - Se configuró healthcheck para `postgres` (`pg_isready`), `backend` (`wget http://localhost:8080/api/v1/health`) y `frontend` (`wget http://127.0.0.1:80/`).
  - Se establecieron dependencias con `condition: service_healthy` en `docker-compose.yml`.
  - En `nginx.conf` se añadieron cabeceras de seguridad, límites de tasa y bloqueo de extensiones sensibles.
- **Justificación Técnica:** Evita que Nginx intente enviar tráfico al backend antes de que Spring Boot y PostgreSQL hayan completado su inicialización, erradicando los errores 502 Bad Gateway y los reinicios en bucle.
- **Pruebas y Resultados:**
  - `docker compose up -d`: Los tres contenedores alcanzaron el estado `(healthy)` de forma secuencial y coordinada (Pass).

---

## 3. Resumen de Pruebas Ejecutadas

| Suite de Pruebas | Entorno | Cantidad | Resultado |
|---|---|---|---|
| **Backend Unit & Integration Tests** (`mvnw test`) | JUnit 5 + Spring Boot Test | 20 | **20 Pasados, 0 Fallidos** |
| **Frontend Tests** (`vitest run`) | Node 22 + Vitest + JSDOM | 74 | **74 Pasados, 0 Fallidos** |
| **Docker Build** (`docker compose build`) | Buildx / Docker Engine | 2 imágenes | **Exitoso (Backend + Frontend)** |
| **Docker Compose Orchestration** | Docker Compose v5 | 3 servicios | **Todos saludables (`healthy`)** |
| **Prueba Dinámica de Upload Malicioso** | curl -> Nginx -> Spring Boot | 2 pruebas | **HTTP 415 (Rechazado correctamente)** |
| **Prueba Dinámica de Upload Legítimo** | curl -> Nginx -> Spring Boot | 1 prueba | **HTTP 200 (Registrado correctamente)** |
| **Prueba Dinámica de Healthcheck** | curl -> Nginx -> Spring Boot | 1 prueba | **HTTP 200 {"status":"UP"}** |

