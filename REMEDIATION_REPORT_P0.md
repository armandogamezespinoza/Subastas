# REPORTE DE REMEDIACIÓN CONTROLADA — VULNERABILIDADES CRÍTICAS (P0)

**Proyecto:** Subasta Auction Platform  
**Entorno:** Spring Boot 3.3.4 (Java 21) / PostgreSQL 15 / Docker Compose / Nginx  
**Responsable:** Senior Application Security Engineer & DevSecOps  
**Fecha:** 10 de Noviembre de 2026  
**Estado de P0:** **100% REMEDIADO Y VALIDADO**  

---

## 1. Resumen de Remediación

En apego a las directivas de seguridad para la preparación de producción en Oracle Cloud Infrastructure (OCI), se ha ejecutado la remediación estricta y controlada de las **cuatro vulnerabilidades críticas (P0)** identificadas en la auditoría inicial.

No se realizaron refactorizaciones cosméticas ni se eliminó funcionalidad preexistente. Todas las soluciones fueron diseñadas e implementadas respetando la arquitectura del proyecto, los estándares de Spring Boot 3 / Spring Security 6 y el principio de mínimo privilegio.

---

## 2. Detalle de Remediación por Vulnerabilidad

### 2.1. [VULN-01] BOLA / IDOR en Documentos Confidenciales
- **Vulnerabilidad Original:** La ruta `/api/v1/revision/documentos/**` estaba configurada con `permitAll()` en Spring Security, permitiendo a cualquier actor no autenticado en Internet enumerar y descargar identificaciones oficiales (INE), CURP, RFC y estados de cuenta bancarios de compradores y vendedores.
- **Archivos Modificados / Creados:**
  - `subasta-backend/src/main/java/com/subasta/security/SecurityConfig.java`
  - `subasta-backend/src/main/java/com/subasta/controller/RevisionController.java`
  - `subasta-backend/src/test/java/com/subasta/subasta_backend/DocumentSecurityIdorTests.java` (Nuevo)
- **Cambios Realizados:**
  1. En `SecurityConfig.java`, se eliminó `/api/v1/revision/documentos/**` de `permitAll()` y se restringió explícitamente a usuarios autenticados (`.authenticated()`).
  2. Se configuró un `AuthenticationEntryPoint` que devuelve HTTP 401 Unauthorized ante peticiones sin credenciales.
  3. En `RevisionController.java`, se implementó el método de autorización a nivel de recurso `isAuthorizedToAccessDocument(Documento, Authentication)`:
     - Permite el acceso a roles administrativos (`ADMINISTRADOR`, `ADMIN`, `APROBADOR`, `CONTROLER`).
     - Para usuarios regulares (`COMPRADOR` o `VENDEDOR`), consulta la entidad correspondiente y valida estrictamente que el email o ID del usuario autenticado coincida con el dueño del expediente.
     - Ante solicitudes de documentos ajenos, rechaza inmediatamente con **HTTP 403 Forbidden**.
- **Pruebas Ejecutadas:**
  - Suite: `DocumentSecurityIdorTests` (4 pruebas unitarias/integración):
    1. Usuario no autenticado intentando acceder a documento -> **HTTP 401 Unauthorized** (Pass).
    2. Usuario atacante intentando acceder a documento ajeno (IDOR) -> **HTTP 403 Forbidden** (Pass).
    3. Usuario legítimo propietario accediendo a su propio documento -> **HTTP 200 OK** (Pass).
    4. Administrador / Aprobador accediendo a cualquier documento -> **HTTP 200 OK** (Pass).
- **Resultado:** **CORREGIDO Y VERIFICADO.**

---

### 2.2. [VULN-02] Bypass Criptográfico de OTP (Fuerza Bruta Offline sobre JWT)
- **Vulnerabilidad Original:** El endpoint `/api/v1/auth/send-code` incrustaba el hash SHA-256 del código de 6 dígitos dentro del JWT `challengeToken` devuelto al cliente. Al tener el secreto hardcodeado y un espacio de solo 900,000 combinaciones, un atacante podía crackear el código localmente en <200ms sin tener acceso al correo de la víctima. Adicionalmente, el código no tenía límite de intentos en el servidor y los códigos se imprimían en texto claro en los logs.
- **Archivos Modificados / Creados:**
  - `subasta-backend/src/main/java/com/subasta/service/VerificationCodeService.java` (Nuevo)
  - `subasta-backend/src/main/java/com/subasta/security/JwtService.java`
  - `subasta-backend/src/main/java/com/subasta/controller/AuthController.java`
  - `subasta-backend/src/main/java/com/subasta/service/EmailService.java`
  - `subasta-backend/src/test/java/com/subasta/subasta_backend/OtpSecurityTests.java` (Nuevo)
- **Cambios Realizados:**
  1. Se creó `VerificationCodeService`:
     - Almacena los códigos exclusivamente en memoria en el servidor con expiración estricta de 10 minutos (`Instant`).
     - Códigos generados mediante `SecureRandom` criptográficamente seguro.
     - Control de intentos: máximo 3 intentos fallidos. Al tercer fallo, el desafío se invalida automáticamente.
     - Invalidation on use: Una vez validado correctamente, el código se borra de inmediato del servidor para prevenir ataques de repetición (Replay Attacks).
  2. En `JwtService.java`, se eliminó el claim `codeHash` del `challengeToken`. El token ahora solo contiene un `challengeId` aleatorio y el correo destinatario.
  3. En `AuthController.java`:
     - Se integró la validación server-side.
     - En el endpoint `/login`, se unificaron las respuestas de fallo para usuarios inexistentes y contraseñas incorrectas con el mensaje genérico `"Credenciales incorrectas"`, cerrando la fuga de información por enumeración de usuarios.
  4. En `EmailService.java`, se eliminó el registro en log del código de verificación en texto plano.
- **Pruebas Ejecutadas:**
  - Suite: `OtpSecurityTests` (4 pruebas):
    1. Verificación de que `challengeToken` no expone `codeHash` en el payload JWT -> **Pass**.
    2. Intentos fallidos con código incorrecto decrementan intentos y bloquean al 3er fallo -> **Pass**.
    3. Verificación exitosa e invalidación inmediata para prevenir replay -> **Pass**.
    4. Prevención de enumeración de usuarios en `/login` devolviendo mensaje idéntico -> **Pass**.
  - Pruebas frontend: `endToEndFlow.test.js`, `verificationFlow.test.js`, `backendConsumption.test.js` -> **Pass**.
- **Resultado:** **CORREGIDO Y VERIFICADO.**

---

### 2.3. [VULN-03] Credenciales y Secretos Hardcodeados
- **Vulnerabilidad Original:** En `subasta-backend/src/main/resources/application.yml` se encontraban expuestas credenciales de aplicación de Gmail en texto claro (`pabc n*** **** ehaj`), así como una clave secreta JWT estática (`404E635266556A...`) compartida en código fuente y en el historial de Git (commit `3700b1a`).
- **Archivos Modificados:**
  - `subasta-backend/src/main/resources/application.yml` (Eliminado del repositorio)
  - `subasta-backend/src/main/resources/application.properties` (Parametrizado sin secretos)
  - `subasta-backend/src/main/java/com/subasta/security/JwtService.java` (Eliminado fallback estático y añadida validación)
  - `.env.example` (Actualizado con variables limpias y documentadas)
  - `.env` (Verificado que esté ignorado por `.gitignore`)
  - `subasta-backend/src/test/resources/application.properties`
- **Cambios Realizados:**
  1. Se eliminó por completo `application.yml`, erradicando la contraseña de Gmail y el JWT secret en disco.
  2. En `application.properties`, todas las variables sensibles se cargan obligatoriamente desde el entorno: `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${JWT_SECRET}`, `${MAIL_USERNAME}`, `${MAIL_PASSWORD}`.
  3. En `JwtService.java`, se eliminó el fallback hardcodeado y se agregó un método `@PostConstruct validateSecret()` que impide que la aplicación inicie si `JWT_SECRET` está ausente o tiene menos de 256 bits (32 bytes).
  4. Se verificó con `git check-ignore -v .env` que `.env` está estrictamente ignorado por `.gitignore:8:*.env`.
  5. Se actualizó `.env.example` con variables de entorno seguras de muestra.
  6. **Inventario de Credenciales que DEBEN Rotarse externamente:**
     - **Contraseña de Aplicación de Gmail:** La clave `pabc n*** **** ehaj` debe ser revocada inmediatamente en Google Account (Seguridad -> Contraseñas de aplicación).
     - **Clave Secreta JWT:** El valor `404E63...` fue reemplazado por un secreto aleatorio de 256 bits generado con `openssl rand -hex 32`.
     - **Historial de Git:** Los commits `3700b1a`, `cfa9fb9`, `dd96817`, `97466e8`, `48b095d` y `7fd433f` contienen la versión anterior del archivo. Conforme a las reglas de auditoría, **no se reescribió el historial de Git destructivamente**; se requerirá coordinar una purga con `git-filter-repo` o `bfg` antes del push a repositorios remotos públicos.
- **Pruebas Ejecutadas:**
  - Verificación de arranque de Spring Boot sin secretos hardcodeados.
  - Validación de que `JwtService` rechaza inicios sin variable `JWT_SECRET`.
- **Resultado:** **CORREGIDO Y VERIFICADO.**

---

### 2.4. [VULN-04] Exposición Pública de PostgreSQL y Mapeos de Docker Inseguros
- **Vulnerabilidad Original:** En `docker-compose.yml`, los puertos `5432:5432` (PostgreSQL) y `8080:8080` (Spring Boot Tomcat) estaban mapeados directamente al host (`0.0.0.0`), exponiendo el motor de base de datos a Internet. Además, Spring Boot operaba con el superusuario `postgres` y el contenedor backend corría como `root`.
- **Archivos Modificados / Creados:**
  - `docker-compose.yml`
  - `subasta-backend/Dockerfile`
  - `docker/postgres/01-init-app-user.sh` (Nuevo script de inicialización)
- **Cambios Realizados:**
  1. Se eliminaron las directivas `ports: "5432:5432"` del servicio `postgres` y `ports: "8080:8080"` del servicio `backend`.
  2. Nginx (`frontend`) en el puerto `80` es el **único contenedor con puertos expuestos al host**. Toda la comunicación entre Nginx, Spring Boot y PostgreSQL ocurre exclusivamente dentro de la red interna `app-network`.
  3. Se creó el script `docker/postgres/01-init-app-user.sh` (montado en `/docker-entrypoint-initdb.d:ro`), el cual crea automáticamente un usuario de aplicación `subasta_app` con permisos `NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`, otorgando privilegios únicamente sobre el esquema `Subasta`.
  4. En `subasta-backend/Dockerfile`, se implementó la compilación multi-etapa optimizada y la ejecución bajo el usuario sin privilegios `appuser:appgroup` (`USER appuser`), eliminando la ejecución como `root`.
  5. Se verificó que los volúmenes `pgdata` y `backend_uploads` mantienen la persistencia íntegra de datos.
- **Pruebas Ejecutadas:**
  - Ejecución de `docker compose config` sin errores.
  - Comprobación de que la salida de Compose no contiene ningún puerto expuesto para `postgres` ni `backend`.
- **Resultado:** **CORREGIDO Y VERIFICADO.**

---

## 3. Matriz de Validación de Pruebas

| Suite de Pruebas | Entorno | Casos Ejecutados | Fallos | Estado |
|---|---|---|---|---|
| `DocumentSecurityIdorTests` | Spring Boot JUnit 5 (MockMvc) | 4 | 0 | **PASÓ** |
| `OtpSecurityTests` | Spring Boot JUnit 5 (MockMvc) | 4 | 0 | **PASÓ** |
| `AuthAndRevisionFlowTests` | Spring Boot JUnit 5 (MockMvc) | 4 | 0 | **PASÓ** |
| `SubastaBackendApplicationTests` | Spring Boot JUnit 5 Context | 1 | 0 | **PASÓ** |
| **Total Backend** | **Maven / OpenJDK 21** | **13** | **0** | **100% PASÓ** |
| `endToEndFlow.test.js` | Frontend Vitest / JSDOM | 1 | 0 | **PASÓ** |
| `verificationFlow.test.js` | Frontend Vitest / JSDOM | 4 | 0 | **PASÓ** |
| `backendConsumption.test.js` | Frontend Vitest / JSDOM | 3 | 0 | **PASÓ** |
| `docker compose config` | Docker Compose v2 CLI | Sintaxis & Redes | 0 | **VÁLIDO** |

---

## 4. Estado de Vulnerabilidades Pendientes (Prioridades P1, P2 y P3)

Conforme a la instrucción expresa del usuario, **no se aplicaron modificaciones sobre las prioridades P1, P2 o P3 en esta sesión**:

| Prioridad | ID | Hallazgo | Estado Actual |
|---|---|---|---|
| **P1** | **VULN-05** | CORS permisivo con `AllowCredentials: true` | *Pendiente para Fase P1* |
| **P1** | **VULN-06** | Subida de archivos sin validación de magic bytes (Apache Tika) | *Pendiente para Fase P1* |
| **P1** | **VULN-07** | Ausencia de Rate Limiting (Bucket4j / Nginx limit_req) | *Pendiente para Fase P1* |
| **P1** | **VULN-08** | Cabecera `X-Frame-Options` deshabilitada (Clickjacking) | *Pendiente para Fase P1* |
| **P2** | **VULN-11** | Extracción de tokens JWT desde query parameter (`?token=`) | *Pendiente para Fase P2* |
| **P2** | **VULN-12** | Consultas N+1 sin paginación en `/solicitudes` | *Pendiente para Fase P2* |
| **P2** | **VULN-13** | Vulnerabilidades en dependencias de testing (`tinypool`) | *Pendiente para Fase P2* |
| **P3** | **REC-01** | Content Security Policy (CSP) ausente | *Pendiente para Fase P3* |

---

## 5. Riesgos Residuales Inmediatos

1. **Compromiso previo de la clave SMTP:** Hasta que el usuario no acceda a su consola de Google y revoque la contraseña de aplicación expuesta en el commit `3700b1a`, la cuenta de correo sigue técnicamente comprometida en caso de que el repositorio sea público o compartido.
2. **Falta de Rate Limiting (P1):** Aunque el endpoint `/login` ya no revela si el usuario existe o no, sigue siendo susceptible a ataques de fuerza bruta continuados hasta que se incorpore el filtro de tasa Bucket4j y `limit_req` de Nginx.
3. **Subida de archivos sin magic bytes (P1):** La subida en onboarding aún no inspecciona la cabecera binaria del archivo mediante Tika, lo cual debe abordarse en el siguiente bloque.

---

## 6. Dictamen de la Fase

### **`FASE P0 COMPLETADA CON ÉXITO`**
Las 4 vulnerabilidades críticas bloqueantes han sido completamente neutralizadas en el código fuente, la configuración y los contenedores, con evidencia técnica y suites de pruebas automatizadas en verde.

Quedo a la espera de tu autorización y comentarios para iniciar con la remediación de las vulnerabilidades **P1 (Alta Prioridad)**.

