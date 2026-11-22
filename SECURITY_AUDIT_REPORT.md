# REPORTE DE AUDITORÍA INTEGRAL DE SEGURIDAD
**Proyecto:** Subasta Platform (Backend Spring Boot 3 + PostgreSQL + Frontend Vanilla + Nginx)  
**Objetivo de Despliegue:** Oracle Cloud Infrastructure (OCI) Always Free Tier (Ampere A1 ARM64)  
**Fecha de Auditoría:** 10 de Noviembre de 2026  
**Equipo Auditor:** Cybersecurity, AppSec, Backend, Database, Cloud OCI & DevSecOps Engineering  
**Dictamen Final:** **`NOT READY FOR PRODUCTION`**

---

## 1. Resumen Ejecutivo

Se ha llevado a cabo una auditoría integral de seguridad de código estático, configuración, dependencias, flujo criptográfico e infraestructura objetivo sobre el repositorio `DesarrolloSubasta`.

El proyecto presenta avances arquitectónicos positivos (uso de Java 21, separación por capas, uso de BCrypt para contraseñas estándar y contenedorización básica con Docker Compose). No obstante, **el sistema no se encuentra en condiciones seguras para ser publicado en Internet**. 

Se identificaron **4 vulnerabilidades de severidad CRÍTICA**, **5 de severidad ALTA**, **4 de severidad MEDIA** y diversas observaciones de configuración que permitirían a un atacante no autenticado:
1. **Descargar y visualizar todos los documentos de identidad confidenciales (INE, CURP, SAT, Estados de Cuenta, Actas Constitutivas)** de compradores y vendedores mediante enumeración directa (IDOR/BOLA) debido a un bypass intencional o accidental de seguridad en `SecurityConfig`.
2. **Vulnerar el flujo de verificación en dos pasos (OTP)** y verificar correos de terceros de forma arbitraria sin acceder a la cuenta de correo real, derivado de la exposición del hash del código dentro de un JWT descifrable y del secreto JWT hardcodeado.
3. **Exfiltrar credenciales reales de correo y claves criptográficas** expuestas en el historial de Git y archivos de configuración.
4. **Tomar el control o denegar el servicio de la base de datos PostgreSQL**, la cual está expuesta al puerto público `5432:5432` utilizando por defecto el superusuario `postgres`.
5. **Realizar ataques de Cross-Origin Request Forgery / Data Theft** debido a configuraciones CORS que combinan comodines (`*`) con `AllowCredentials(true)`.

El dictamen formal es **NOT READY FOR PRODUCTION**. El despliegue público en OCI debe postergarse hasta que se ejecute la fase de remediación de las vulnerabilidades P0 y P1.

---

## 2. Arquitectura Actual Identificada

```
                                  [ INTERNET ]
                                        │
                         (OCI Security List / NSG)
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │ :80 (HTTP)                 │ :8080 (EXPUESTO)           │ :5432 (EXPUESTO)
           ▼                            ▼                            ▼
    [ Docker: Nginx ]          [ Docker: Spring Boot ]      [ Docker: PostgreSQL ]
    (Vanilla HTML/JS)                 (Tomcat)                   (postgres:15)
           │                            ▲                            ▲
           │ proxy_pass /api/           │                            │
           └────────────────────────────┘ (spring.datasource)        │
                                        └────────────────────────────┘
```

- **Frontend:** Single Page Application (SPA) Vanilla HTML5, CSS3, JavaScript ES Modules, iconos Lucide, utilidades Tailwind CDN.
- **Backend:** Spring Boot 3.3.4 (Java 21), Spring Security 6, Spring Data JPA / Hibernate 6, JJWT 0.12.6, Spring Mail, Apache Commons / Jackson.
- **Base de Datos:** PostgreSQL 15 Alpine montada en contenedor Docker con volumen persistente `pgdata`.
- **Proxy Inverso:** Nginx Alpine sirviendo estáticos en `/` y redirigiendo `/api/` hacia `backend:8080`.
- **Infraestructura Objetivo:** OCI VM.Standard.A1.Flex (Ampere ARM64) autoadministrada en Subnet Pública.

---

## 3. Superficie de Ataque

1. **Endpoints Públicos de Autenticación (`/api/v1/auth/**`):**
   - `/login`: No cuenta con protección contra fuerza bruta ni bloqueo de cuenta tras intentos fallidos. Revela existencia de usuarios mediante mensajes dispares.
   - `/send-code`: Permite envío ilimitado de correos (Mail Bombing / Resource Exhaustion).
   - `/verify-code`: Valida el código de 6 dígitos basándose en un token challenge JWT emitido al cliente.
2. **Endpoints de Onboarding (`/api/v1/onboarding/**`):**
   - `/buyer` y `/seller`: Aceptan multipart form data sin validación de tipo binario (magic bytes) ni límite estricto en proxy/backend, permitiendo subida de archivos arbitrarios y saturación de memoria.
3. **Endpoints de Revisión de Documentos (`/api/v1/revision/documentos/**`):**
   - Expuestos sin autenticación (`permitAll()`), permitiendo acceso IDOR irrestricto a todos los expedientes.
4. **Infraestructura y Red:**
   - Puertos `8080` (Spring Boot) y `5432` (PostgreSQL) mapeados a `0.0.0.0` en `docker-compose.yml`.
   - Nginx escuchando en HTTP puerto 80 sin forzar TLS/HTTPS ni cabeceras HSTS/CSP.

---

## 4. Clasificación de Prioridades (Matriz de Riesgo)

| Prioridad | ID | Hallazgo | Severidad | Acción Requerida |
|---|---|---|---|---|
| **P0** | **VULN-01** | BOLA/IDOR Crítico: Descarga no autenticada de expedientes confidenciales | **CRITICAL** | Bloquear inmediatamente en `SecurityConfig` antes de producción |
| **P0** | **VULN-02** | Bypass Criptográfico de OTP (Precomputación de código 6 dígitos en JWT) | **CRITICAL** | Rediseñar verificación OTP eliminando hashes del token cliente |
| **P0** | **VULN-03** | Credenciales reales de Gmail y JWT Secret hardcodeadas en Git | **CRITICAL** | Rotar credenciales en Google, purgar historial Git y desacoplar `.env` |
| **P0** | **VULN-04** | Exposición pública directa de puerto PostgreSQL (5432) y uso de superuser | **CRITICAL** | Remover mapeo de host en Compose y crear usuario con mínimo privilegio |
| **P1** | **VULN-05** | Configuración insegura de CORS (`*` + `AllowCredentials: true`) | **HIGH** | Configurar lista blanca estricta por dominio de producción |
| **P1** | **VULN-06** | Subida de archivos sin validación de magic bytes (Apache Tika ausente) | **HIGH** | Implementar `FileValidationService` y devolver HTTP 415 |
| **P1** | **VULN-07** | Ausencia total de Rate Limiting (Fuerza bruta y DoS en subidas y login) | **HIGH** | Implementar `limit_req` en Nginx y Bucket4j en Spring Boot (429) |
| **P1** | **VULN-08** | Inyección y bypass de X-Frame-Options (Clickjacking) y SVG XSS | **HIGH** | Activar `frameOptions.sameOrigin()` y sanear SVGs inline |
| **P1** | **VULN-09** | Fuga de códigos OTP en logs del servidor en texto plano | **HIGH** | Eliminar logging de OTPs en `EmailService` |
| **P2** | **VULN-10** | Enumeración de usuarios en endpoint de autenticación (`/login`) | **MEDIUM** | Estandarizar respuesta de error a "Credenciales inválidas" |
| **P2** | **VULN-11** | Tokens JWT aceptados por Query Parameter (`?token=`) | **MEDIUM** | Eliminar autenticación por query parameter en `JwtFilter` |
| **P2** | **VULN-12** | Consultas N+1 y falta de paginación en `/solicitudes` | **MEDIUM** | Implementar `Pageable`, optimizar repositorios e índices |
| **P2** | **VULN-13** | Dependencias vulnerables en herramientas de testing (Tinypool / Vitest RCE) | **MEDIUM** | Actualizar `package.json` para eliminar vulnerabilidad en entorno dev |
| **P3** | **REC-01** | Ausencia de Content Security Policy (CSP) y cabeceras de seguridad | **LOW** | Configurar cabeceras HSTS, CSP, X-Content-Type-Options en Nginx |
| **P3** | **REC-02** | Contenedor backend ejecutado como usuario `root` | **LOW** | Crear usuario sin privilegios (`appuser`) en Dockerfile |

---

## 5. Hallazgos y Evidencias Técnicas

### [VULN-01] BOLA/IDOR Crítico: Descarga no autenticada de expedientes confidenciales
- **Identificador:** VULN-01
- **Categoría OWASP:** API1:2023 - Broken Object Level Authorization / A01:2021 - Broken Access Control
- **Ubicación:** 
  - `subasta-backend/src/main/java/com/subasta/security/SecurityConfig.java:39`
  - `subasta-backend/src/main/java/com/subasta/controller/RevisionController.java:313-355`
- **Severidad:** **CRITICAL** (CVSS 9.1)
- **Descripción Técnica:**
  En `SecurityConfig.java`, la ruta `/api/v1/revision/documentos/**` está configurada explícitamente como `permitAll()`. Simultáneamente, en `RevisionController.java`, los métodos `viewDocument(@PathVariable Long id)` y `downloadDocument(@PathVariable Long id)` consultan el `DocumentoRepository` por ID autonumérico simple y devuelven el archivo binario almacenado en disco sin verificar si el usuario emisor está autenticado, si es el dueño del documento o si cuenta con rol `ADMINISTRADOR`/`APROBADOR`.
- **Escenario de Explotación:**
  Cualquier atacante externo en Internet puede ejecutar un bucle `for id in {1..50000}; do curl https://subasta.com/api/v1/revision/documentos/$id/download; done` y extraer de forma masiva identificaciones oficiales (INE), CURP, RFC, comprobantes de domicilio y estados de cuenta bancarios de todos los usuarios registrados.
- **Solución Recomendada:**
  1. Eliminar `/api/v1/revision/documentos/**` de la lista `permitAll()` en `SecurityConfig`.
  2. Requerir autenticación JWT y roles autorizados (`ADMINISTRADOR`, `APROBADOR`) o verificar que el documento pertenezca al usuario autenticado (mediante `SecurityContextHolder`).

---

### [VULN-02] Bypass Criptográfico de OTP (Precomputación de código en JWT)
- **Identificador:** VULN-02
- **Categoría OWASP:** API2:2023 - Broken Authentication / A07:2021 - Identification and Authentication Failures
- **Ubicación:** 
  - `subasta-backend/src/main/java/com/subasta/security/JwtService.java:29-51`
  - `subasta-backend/src/main/java/com/subasta/controller/AuthController.java:154-184`
- **Severidad:** **CRITICAL** (CVSS 9.8)
- **Descripción Técnica:**
  Cuando un usuario solicita un código de verificación en `/api/v1/auth/send-code`, el servidor genera un código aleatorio de 6 dígitos (`100000` a `999999`), calcula un hash simple `SHA-256(code + secret)` y lo incrusta en el payload del JWT `challengeToken` que devuelve en la respuesta HTTP:
  ```json
  {
    "success": true,
    "challengeToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2aWN0aW1hQGdtYWlsLmNvbSIsInR5cGUiOiJDSEFMTEVOR0VfQ09ERSIsImNvZGVIYXNoIjoiMjg4YzFk..."
  }
  ```
  Debido a que el secreto (`secret`) es conocido (fue expuesto en Git y tiene valor por defecto estático en código) y el espacio de búsqueda del código es de solo 900,000 combinaciones numéricas:
- **Escenario de Explotación:**
  Un atacante solicita la verificación de cualquier correo corporativo o de terceros (`victima@empresa.com`). Al recibir el `challengeToken`, el atacante no necesita interceptar el buzón de la víctima: ejecuta un script local de fuerza bruta que calcula los 900,000 hashes SHA-256 en menos de 200 milisegundos hasta encontrar el que coincida con `codeHash`. Luego envía `/api/v1/auth/verify-code` con el código crackeado, obteniendo un `verifiedEmailToken` y acceso ilegítimo a la cuenta.
- **Solución Recomendada:**
  1. Nunca almacenar hashes del secreto/código en tokens cliente.
  2. Almacenar el código temporal en el servidor (en memoria con expiración corta, Redis o base de datos), asociado a una sesión con límite estricto de 3 intentos fallidos antes de invalidar el código.

---

### [VULN-03] Credenciales de Correo y Secreto JWT Hardcodeados en Repositorio
- **Identificador:** VULN-03
- **Categoría OWASP:** A05:2021 - Security Misconfiguration / A02:2021 - Cryptographic Failures
- **Ubicación:**
  - `subasta-backend/src/main/resources/application.yml:28-29`
  - `subasta-backend/src/main/resources/application.yml:39`
  - `subasta-backend/src/main/java/com/subasta/security/JwtService.java:19`
  - Commit Git `3700b1a93df7300cb293b665ef8e98f309b19b5b`
- **Severidad:** **CRITICAL** (CVSS 9.0)
- **Descripción Técnica:**
  En `application.yml` se encuentran credenciales de producción para el servidor SMTP de Gmail:
  - Usuario: `armandogamez618@gmail.com`
  - Contraseña de aplicación: `pabc n*** **** ehaj` (enmascarada en este reporte)
  - Clave secreta JWT: `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`
  Dicho archivo se encuentra comiteado en el historial de Git, permitiendo la forja de tokens con rol `ADMINISTRADOR` a cualquiera con acceso de lectura al repositorio.
- **Solución Recomendada:**
  1. Rotar inmediatamente la contraseña de aplicación de la cuenta Gmail en Google Account Security.
  2. Generar un nuevo `JWT_SECRET` criptográficamente seguro (`openssl rand -hex 32`) cargado exclusivamente vía variables de entorno.
  3. Eliminar el archivo `application.yml` redundante y asegurar que `application.properties` no contenga valores por defecto sensibles.
  4. Purgar el historial de Git con herramientas como `git-filter-repo` o `BFG Repo-Cleaner`.

---

### [VULN-04] Exposición Pública Directa de PostgreSQL (Puerto 5432) y Uso de Superusuario
- **Identificador:** VULN-04
- **Categoría OWASP:** A05:2021 - Security Misconfiguration
- **Ubicación:** `docker-compose.yml:9-10, 25-27`
- **Severidad:** **CRITICAL** (CVSS 9.1)
- **Descripción Técnica:**
  En `docker-compose.yml`, el servicio `postgres` expone:
  ```yaml
  ports:
    - "5432:5432"
  ```
  Esto abre el listener de la base de datos en `0.0.0.0:5432` de la máquina anfitriona. Al desplegar en OCI, si las Security Lists o el firewall de la instancia tienen el puerto abierto, la base de datos queda directamente accesible desde todo Internet. Además, la aplicación Spring Boot se conecta utilizando las credenciales de `POSTGRES_USER=postgres`, que es el superusuario del motor.
- **Escenario de Explotación:**
  Ataques de fuerza bruta contra el puerto 5432. Si las contraseñas en `.env` son débiles o predecibles, un atacante remoto obtiene acceso directo a PostgreSQL con privilegios de superusuario, permitiendo ejecución de comandos a nivel de sistema operativo (`COPY ... PROGRAM`), borrado total de la base de datos o exfiltración de registros.
- **Solución Recomendada:**
  1. Eliminar la sección `ports` del contenedor `postgres` en `docker-compose.yml`. Los contenedores de Docker ya se comunican internamente mediante la red `app-network`.
  2. Crear un usuario de base de datos restringido (`subasta_app`) con permisos concedidos únicamente sobre el esquema `Subasta`, sin privilegios de `SUPERUSER` ni `CREATEROLE`.

---

### [VULN-05] Configuración Insegura de CORS (`*` con Credenciales)
- **Identificador:** VULN-05
- **Categoría OWASP:** A05:2021 - Security Misconfiguration / API7:2023 - Server-Side Request Forgery
- **Ubicación:**
  - `subasta-backend/src/main/java/com/subasta/security/SecurityConfig.java:53-63`
  - `subasta-backend/src/main/java/com/subasta/controller/OnboardingController.java:16`
  - `subasta-backend/src/main/java/com/subasta/controller/RevisionController.java:28`
  - `subasta-backend/src/main/java/com/subasta/controller/AuthController.java:23`
- **Severidad:** **HIGH** (CVSS 8.2)
- **Descripción Técnica:**
  En `SecurityConfig.java`:
  ```java
  config.setAllowedOriginPatterns(List.of("*"));
  config.setAllowCredentials(true);
  ```
  Permitir cualquier origen comodín (`*`) junto con credenciales (`allowCredentials=true`) habilita a sitios web de terceros maliciosos a realizar peticiones autenticadas en nombre de usuarios de la plataforma que visiten dichos sitios. Adicionalmente, los controladores tienen `@CrossOrigin(origins = "*")` redundantes que anulan políticas finas.
- **Solución Recomendada:**
  Eliminar `@CrossOrigin(origins = "*")` de todos los controladores y definir una lista blanca estricta inyectada desde propiedades de entorno (`app.cors.allowed-origins`).

---

### [VULN-06] Subida de Archivos sin Validación de Magic Bytes (Apache Tika Ausente)
- **Identificador:** VULN-06
- **Categoría OWASP:** A04:2021 - Insecure Design / A03:2021 - Injection
- **Ubicación:** `subasta-backend/src/main/java/com/subasta/service/FileStorageService.java:55-65`
- **Severidad:** **HIGH** (CVSS 8.0)
- **Descripción Técnica:**
  El método `saveFile` de `FileStorageService` extrae la extensión únicamente del nombre de archivo provisto por el cliente:
  ```java
  String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
  int i = originalFilename.lastIndexOf('.');
  if (i > 0) fileExtension = originalFilename.substring(i);
  ```
  No se inspecciona el contenido binario del archivo. Un atacante puede subir un script malicioso (PHP, JSP, HTML, ELF, Shell script) con extensión `.pdf` o `.jpg`. Si estos archivos son descargados por administradores o previsualizados en el navegador, pueden originar ataques de Stored XSS o ejecución de malware en clientes.
- **Solución Recomendada:**
  1. Agregar la dependencia `org.apache.tika:tika-core`.
  2. Implementar `FileValidationService` para inspeccionar la firma binaria (magic bytes) asegurando que el contenido sea exclusivamente `application/pdf` o `image/jpeg`. Retornar HTTP 415 si no coincide.

---

### [VULN-07] Ausencia Total de Rate Limiting y Protección DoS
- **Identificador:** VULN-07
- **Categoría OWASP:** API4:2023 - Unrestricted Resource Consumption / A04:2021 - Insecure Design
- **Ubicación:**
  - `subasta-frontend/nginx.conf:4`
  - `subasta-backend/src/main/resources/application.properties:15-16`
- **Severidad:** **HIGH** (CVSS 7.5)
- **Descripción Técnica:**
  1. `application.properties` permite subidas de hasta `50MB` por archivo y `100MB` por solicitud.
  2. `nginx.conf` tiene `client_max_body_size 50M;` y carece de directivas `limit_req_zone` y `limit_req`.
  3. No existe ningún filtro de limitación de tasa (Rate Limiting) en Spring Boot (Bucket4j).
- **Escenario de Explotación:**
  Un atacante envía múltiples peticiones multipart concurrentes de 50MB hacia `/api/v1/onboarding/buyer`. Los buffers de Tomcat agotan la memoria RAM de la máquina virtual OCI Ampere Always Free, ocasionando que el proceso Java sea terminado por el kernel Linux (OOM Killer). Asimismo, el endpoint `/api/v1/auth/login` puede ser atacado por diccionarios sin restricción de intentos.
- **Solución Recomendada:**
  1. Limitar Nginx a `client_max_body_size 10M;` y agregar `limit_req_zone $binary_remote_addr zone=upload_zone:10m rate=5r/m;`.
  2. Reducir Spring Boot multipart a 10MB máximo por archivo y 30MB total por solicitud.
  3. Implementar un filtro Bucket4j en Spring Security que restrinja peticiones de subida y login a máximo 5 intentos por minuto por IP, respondiendo con HTTP 429.

---

### [VULN-08] Inyección y Bypass de Clickjacking (`frameOptions: disable`) y SVG XSS
- **Identificador:** VULN-08
- **Categoría OWASP:** A05:2021 - Security Misconfiguration / A03:2021 - Injection
- **Ubicación:**
  - `subasta-backend/src/main/java/com/subasta/security/SecurityConfig.java:33`
  - `subasta-backend/src/main/java/com/subasta/controller/RevisionController.java:351`
  - `subasta-frontend/index.html:398`
- **Severidad:** **HIGH** (CVSS 7.4)
- **Descripción Técnica:**
  En `SecurityConfig.java`:
  ```java
  .headers(headers -> headers.frameOptions(frame -> frame.disable()))
  ```
  Esto remueve completamente la cabecera `X-Frame-Options`, permitiendo que la aplicación sea embebida en iframes invisibles en sitios web atacantes para ejecutar ataques de Clickjacking. Adicionalmente, `RevisionController.java` sirve respuestas dinámicas con `Content-Type: image/svg+xml`, y el frontend en `index.html` las renderiza en un `iframe` sin el atributo `sandbox`. Un SVG con payloads `<script>` embebidos se ejecuta en el contexto del dominio de la aplicación.
- **Solución Recomendada:**
  1. En `SecurityConfig.java`, configurar `headers.frameOptions(frame -> frame.sameOrigin())`.
  2. En el frontend, agregar `sandbox="allow-same-origin"` o renderizar las previsualizaciones de SVG como imágenes `<img>` en lugar de `<iframe>`.

---

### [VULN-09] Fuga de Códigos de Verificación OTP en Logs del Servidor
- **Identificador:** VULN-09
- **Categoría OWASP:** A09:2021 - Security Logging and Monitoring Failures
- **Ubicación:** `subasta-backend/src/main/java/com/subasta/service/EmailService.java:21, 32`
- **Severidad:** **HIGH** (CVSS 7.1)
- **Descripción Técnica:**
  En `EmailService.java`, los códigos OTP generados se imprimen directamente en el logger a nivel `INFO`:
  ```java
  log.info(">>> [EMAIL DISPATCH] Verification code for {}: {}", toEmail, code);
  ```
  En un entorno OCI con centralización de logs (OCI Logging Service, Syslog o Grafana Loki), cualquier operador o atacante con acceso de lectura a los logs puede ver los códigos en texto claro y secuestrar sesiones.
- **Solución Recomendada:**
  Eliminar la impresión del código en los logs y registrar únicamente eventos de auditoría no sensibles (ej. `log.info("Verification code dispatched to: {}", toEmail)`).

---

### [VULN-10] Enumeración de Usuarios en Endpoint `/login`
- **Identificador:** VULN-10
- **Categoría OWASP:** A07:2021 - Identification and Authentication Failures
- **Ubicación:** `subasta-backend/src/main/java/com/subasta/controller/AuthController.java:91-113`
- **Severidad:** **MEDIUM** (CVSS 5.3)
- **Descripción Técnica:**
  Si el identificador no existe en la base de datos, el servidor responde con HTTP 401 y el mensaje `"Usuario no encontrado con ese correo o teléfono"`. Si el identificador existe pero la contraseña no coincide, responde `"Contraseña incorrecta"`.
- **Impacto:** Permite a atacantes validar listas masivas de correos o números de teléfono para identificar qué personas están registradas en la plataforma de subastas.
- **Solución Recomendada:** Retornar una respuesta genérica y tiempo de procesamiento constante: `"Credenciales incorrectas"`.

---

### [VULN-11] Aceptación de Tokens JWT por Query Parameter (`?token=`)
- **Identificador:** VULN-11
- **Categoría OWASP:** A02:2021 - Cryptographic Failures / API2:2023 - Broken Authentication
- **Ubicación:** 
  - `subasta-backend/src/main/java/com/subasta/security/JwtFilter.java:36-38`
  - `subasta-frontend/js/app.js:540-541`
- **Severidad:** **MEDIUM** (CVSS 5.9)
- **Descripción Técnica:**
  `JwtFilter` extrae el token del encabezado `Authorization: Bearer` o del parámetro de URL `?token=`. Al pasar tokens JWT en URLs (utilizado en el frontend para previsualizar documentos), los tokens quedan guardados en el historial de navegación, en los logs de acceso de Nginx, proxies intermedios y en la cabecera `Referer` si se navega a un enlace externo.
- **Solución Recomendada:**
  Utilizar únicamente la cabecera `Authorization: Bearer <token>` o cookies con flags `HttpOnly; Secure; SameSite=Strict`.

---

### [VULN-12] Consultas N+1 y Falta de Paginación en Panel de Solicitudes
- **Identificador:** VULN-12
- **Categoría OWASP:** API4:2023 - Unrestricted Resource Consumption
- **Ubicación:** `subasta-backend/src/main/java/com/subasta/controller/RevisionController.java:51-52, 103-144`
- **Severidad:** **MEDIUM** (CVSS 5.3)
- **Descripción Técnica:**
  Los métodos `getKpis` y `getSolicitudes` ejecutan `compradorRepository.findAll()` y `vendedorRepository.findAll()` trayendo la totalidad de los registros a memoria. Luego, dentro de un bucle `for`, ejecutan `documentoRepository.findByTipoUsuarioAndRegistroId(...)` para cada fila (problema N+1). A medida que crezca la base de datos, este endpoint saturará la CPU de la instancia OCI y la memoria del pool de conexiones.
- **Solución Recomendada:**
  1. Implementar consultas paginadas con `org.springframework.data.domain.Pageable`.
  2. Reemplazar el conteo en bucle con una consulta agregada (`COUNT`) o `LEFT JOIN FETCH`.

---

### [VULN-13] Dependencias Vulnerables en Herramientas de Testing (tinypool)
- **Identificador:** VULN-13
- **Categoría OWASP:** A06:2021 - Vulnerable and Outdated Components
- **Ubicación:** `subasta-frontend/package.json`
- **Severidad:** **MEDIUM** (CVSS 7.8 en entorno de integración)
- **Descripción Técnica:**
  El comando `npm audit` reporta 3 vulnerabilidades en el árbol de dependencias de testing:
  - `tinypool <= 2.1.1`: Prototype Pollution con potencial Remote Code Execution (`GHSA-5gmw-xhrv-c9v3`, `GHSA-85c8-ppgw-ccpr`).
  - `@vitest/mocker`: Arbitrary File Read / Path Traversal (`GHSA-82fw-gwwq-j7x9`).
- **Solución Recomendada:**
  Actualizar `vitest` a una versión parcheada en `package.json` y ejecutar `npm audit fix`.

---

## 6. Auditoría de Infraestructura y Configuración OCI

### A. Red y Virtual Cloud Network (VCN)
Para el despliegue en la instancia autoadministrada OCI Ampere A1, se debe configurar la siguiente topología de red:

```
[ Internet Gateway ]
       │
[ OCI VCN: vcn-subasta (10.0.0.0/16) ]
       │
[ Public Subnet: subnet-public (10.0.1.0/24) ]
       │
[ Network Security Group: nsg-subasta-web ]
       ├── Ingress: TCP 80  (0.0.0.0/0) -> HTTP Let's Encrypt / Redirect
       ├── Ingress: TCP 443 (0.0.0.0/0) -> HTTPS Seguro
       └── Ingress: TCP 22  (IP_DE_GESTION/32) -> SSH Seguro
```

**Reglas Críticas de Exposición en OCI:**
- **REGLA DE ORO:** Los puertos `8080` (Spring Boot) y `5432` (PostgreSQL) **NUNCA** deben tener reglas de ingreso en las Security Lists o NSGs de OCI.
- El puerto `22` (SSH) debe estar restringido a la IP pública estática del administrador o accesible a través de **OCI Bastion Service** (servicio gratuito nativo de OCI).

### B. Hardening del Sistema Operativo (Oracle Linux / Ubuntu en OCI)
1. **Configuración SSH (`/etc/ssh/sshd_config`):**
   ```ini
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   MaxAuthTries 3
   ClientAliveInterval 300
   ClientAliveCountMax 2
   ```
2. **Firewall del Sistema Operativo (`firewalld` en Oracle Linux o `ufw` en Ubuntu):**
   - Permitir únicamente puertos `80`, `443` y `22`.
   - Bloquear cualquier paquete directo a `8080` o `5432` en la interfaz externa.
3. **Protección contra fuerza bruta:** Instalar y habilitar `fail2ban` o `crowdsec` protegiendo SSH.

### C. Nginx Reverse Proxy y Certificados SSL/TLS
Nginx debe ser el único punto de entrada público, gestionando la terminación TLS con certificados de **Let's Encrypt** (vía `certbot`).
- Redirección automática de HTTP (80) a HTTPS (443) con código 301.
- TLS 1.2 y TLS 1.3 exclusivamente. Cifrados seguros (Forward Secrecy).
- Cabecera `Strict-Transport-Security` (HSTS) activada.

---

## 7. Configuración Recomendada para Producción

### A. `docker-compose.yml` Seguro para OCI
```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: subasta_postgres
    restart: unless-stopped
    env_file:
      - .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    # SEGURIDAD: NO se mapea el puerto 5432 al host.
    # Solo los contenedores de la red interna acceden a la BD.
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - app-network

  backend:
    build:
      context: ./subasta-backend
      dockerfile: Dockerfile
    container_name: subasta_backend
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION_MS=${JWT_EXPIRATION_MS}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
      - MAIL_HOST=${MAIL_HOST}
      - MAIL_PORT=${MAIL_PORT}
      - MAIL_USERNAME=${MAIL_USERNAME}
      - MAIL_PASSWORD=${MAIL_PASSWORD}
      - JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC
    volumes:
      - backend_uploads:/app/uploads
    depends_on:
      - postgres
    # SEGURIDAD: Puerto 8080 interno, no expuesto al host.
    networks:
      - app-network

  frontend:
    build:
      context: ./subasta-frontend
      dockerfile: Dockerfile
    container_name: subasta_frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  pgdata:
  backend_uploads:

networks:
  app-network:
    driver: bridge
```

### B. `subasta-frontend/nginx.conf` con Hardening Completo
```nginx
# Limitación de tasa: 10MB memoria, 5 peticiones/minuto por IP para uploads y login
limit_req_zone $binary_remote_addr zone=upload_rate_zone:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=auth_rate_zone:10m rate=10r/m;
limit_req_status 429;

server {
    listen 80;
    server_name _;
    
    # Redirección estricta a HTTPS en producción
    # return 301 https://$host$request_uri;

    client_max_body_size 10M;

    # Cabeceras de Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src 'self' blob:; connect-src 'self';" always;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Protección de endpoints de onboarding con subida de archivos
    location /api/v1/onboarding/ {
        limit_req zone=upload_rate_zone burst=2 nodelay;

        proxy_pass http://backend:8080/api/v1/onboarding/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Protección de login contra fuerza bruta
    location /api/v1/auth/ {
        limit_req zone=auth_rate_zone burst=5 nodelay;

        proxy_pass http://backend:8080/api/v1/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy general para el resto de la API
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 8. Checklist de Seguridad Previo al Despliegue

- [ ] **Secretos:** ¿Se revocó y rotó la contraseña de aplicación de Gmail expuesta en Git?
- [ ] **Secretos:** ¿Se generó un nuevo `JWT_SECRET` aleatorio de 64 caracteres hex y se eliminó de cualquier archivo de código o historial?
- [ ] **Autorización:** ¿Se eliminó `/api/v1/revision/documentos/**` de `permitAll()` y se restringió exclusivamente a `ADMINISTRADOR` y `APROBADOR`?
- [ ] **Validación:** ¿Se implementó Apache Tika para verificar magic bytes de archivos y rechazar todo lo que no sea PDF o JPG/JPEG con HTTP 415?
- [ ] **DoS / Rate Limiting:** ¿Se fijó `client_max_body_size 10M` en Nginx y se activaron filtros Bucket4j para limitar a 5 uploads/min por IP?
- [ ] **Red Docker:** ¿Se removieron los mapeos `5432:5432` y `8080:8080` de `docker-compose.yml`?
- [ ] **CORS:** ¿Se eliminó el comodín `*` con credenciales y se configuró la lista blanca con el dominio final de OCI?
- [ ] **Manejo de Errores:** ¿Se implementó `@RestControllerAdvice` para no exponer stack traces ni detalles SQL en respuestas HTTP?
- [ ] **OCI Network:** ¿Se verificó que la Security List de OCI solo tenga abiertos los puertos 80, 443 y 22 (restringido)?
- [ ] **Base de Datos:** ¿Se creó un usuario de BD sin privilegios de superusuario para Spring Boot?

---

## 9. Riesgos Residuales

1. **Agotamiento de almacenamiento en disco en OCI Always Free:** La instancia Always Free cuenta con 50 GB a 200 GB de volumen de bloques. Si bien se implementará limitación de tamaño (10MB) y rate limiting, la subida continuada de expedientes legítimos eventualmente llenará el disco local. Se recomienda a mediano plazo migrar el almacenamiento de documentos hacia **OCI Object Storage** mediante bucket privado y URLs prefirmadas.
2. **Dependencias del frontend servidas desde CDNs externas (Tailwind y Lucide):** `index.html` carga scripts desde `cdn.tailwindcss.com` y `unpkg.com`. Si estos CDNs sufren caídas o ataques a la cadena de suministro, la interfaz puede verse afectada. Se recomienda empaquetar los assets localmente o implementar Subresource Integrity (`integrity="sha384-..."`).
3. **Destrucción de datos ante recreación de volúmenes:** Si el volumen Docker `pgdata` se elimina accidentalmente durante comandos `docker compose down -v`, los datos se perderán sin remedio. Es imperativo configurar un script cron diario en OCI que ejecute `pg_dump` y transfiera los backups a un Bucket seguro.

---

## 10. Limitaciones de la Auditoría

- La presente auditoría se realizó mediante **análisis estático manual y revisión de configuración de código fuente**. 
- No se ejecutaron pruebas de penetración dinámicas activas (DAST) ni herramientas como Semgrep, Gitleaks, Trivy u OWASP ZAP debido a que no se encuentran instaladas en el entorno local del sistema operativo anfitrión.
- No se verificaron las reglas de OCI Cloud Guard, OCI Vault ni políticas IAM de tenancy al no tener conectividad ni credenciales CLI activas de OCI.

---

## 11. Dictamen Final

### **`NOT READY FOR PRODUCTION`**

Existen vulnerabilidades críticas activas (BOLA/IDOR en documentos confidenciales, bypass del flujo criptográfico de verificación, credenciales expuestas en Git y PostgreSQL con puerto expuesto y superusuario) que impiden la publicación segura en Internet. 

---

# FASE 2: PLAN DE REMEDIACIÓN PROPUESTO (ORDENADO POR PRIORIDAD)

Conforme a las reglas de la auditoría, **no se ha modificado ningún archivo del proyecto**. A continuación se detalla el plan de acción paso a paso. Se solicita la autorización expresa del usuario antes de proceder con las modificaciones:

### 1. [Prioridad P0] Cerrar Vulnerabilidad IDOR en Documentos
- **Archivo:** `subasta-backend/src/main/java/com/subasta/security/SecurityConfig.java`
- **Cambio:** Remover `/api/v1/revision/documentos/**` de `permitAll()` y agregar control en `RevisionController.java` para verificar que solo usuarios con roles autorizados accedan a los expedientes.
- **Justificación:** Previene la exfiltración masiva de documentos de identidad de compradores y vendedores.
- **Riesgo de no solucionarlo:** Filtración masiva de información confidencial (Violación flagrante de leyes de protección de datos personales).
- **Verificación:** Ejecutar `curl -i http://localhost:8080/api/v1/revision/documentos/1/download` sin token y verificar respuesta HTTP 401/403.

### 2. [Prioridad P0] Saneamiento de Credenciales y Eliminación de `application.yml`
- **Archivos:**
  - `subasta-backend/src/main/resources/application.yml` (Eliminar o limpiar)
  - `subasta-backend/src/main/resources/application.properties` (Parametrizar variables)
  - `subasta-backend/src/main/java/com/subasta/security/JwtService.java` (Eliminar secreto default hardcodeado)
  - `.env.example`
- **Cambio:** Mover todas las credenciales de correo, base de datos y JWT a variables de entorno obligatorias sin fallbacks inseguros.
- **Justificación:** Elimina credenciales expuestas en código fuente.
- **Riesgo de no solucionarlo:** Forja de tokens de administrador y uso ilegítimo de buzón SMTP.
- **Verificación:** Comprobar que el backend falle al arrancar si falta `JWT_SECRET` en lugar de usar un fallback conocido.

### 3. [Prioridad P0] Rediseño de Verificación OTP de Correo
- **Archivos:**
  - `subasta-backend/src/main/java/com/subasta/security/JwtService.java`
  - `subasta-backend/src/main/java/com/subasta/controller/AuthController.java`
- **Cambio:** Eliminar `codeHash` del token devuelto al cliente. Gestionar la validación de código internamente en memoria o base de datos con expiración de 10 minutos y máximo 3 intentos.
- **Justificación:** Cierra el bypass que permite adivinar el código mediante fuerza bruta local sobre el JWT.
- **Riesgo de no solucionarlo:** Suplantación de identidad en registros y validación fraudulenta de correos.
- **Verificación:** Inspeccionar el token devuelto por `/send-code` en jwt.io y verificar que no contenga ningún dato sobre el código.

### 4. [Prioridad P0] Aislamiento de Red de PostgreSQL y Docker Hardening
- **Archivo:** `docker-compose.yml`
- **Cambio:** Remover `5432:5432` y `8080:8080` de los mapeos de puertos públicos.
- **Justificación:** Impide que Internet tenga acceso directo a la base de datos y al Tomcat sin pasar por las reglas de Nginx.
- **Riesgo de no solucionarlo:** Escaneo de puertos y compromiso directo de PostgreSQL.
- **Verificación:** Ejecutar `nc -zv <IP_HOST> 5432` desde una máquina remota y verificar conexión rechazada/cerrada.

### 5. [Prioridad P1] Validación de Tipo Binario de Archivos (Magic Bytes) con Apache Tika
- **Archivos:**
  - `subasta-backend/pom.xml` (Agregar `tika-core:2.9.2`)
  - `subasta-backend/src/main/java/com/subasta/service/FileValidationService.java` (Crear)
  - `subasta-backend/src/main/java/com/subasta/service/FileStorageService.java` (Integrar)
  - `subasta-backend/src/main/java/com/subasta/exception/UnsupportedMediaTypeException.java` (Crear)
- **Cambio:** Sniffing obligatorio de magic bytes para validar únicamente `application/pdf` y `image/jpeg`. Devolver HTTP 415.
- **Justificación:** Evita la subida de ejecutables o scripts camuflados como documentos.
- **Riesgo de no solucionarlo:** Subida de malware, evasión de filtros y ataques cruzados.
- **Verificación:** Subir un archivo de texto renombrado a `.pdf` y verificar respuesta HTTP 415.

### 6. [Prioridad P1] Implementación de Rate Limiting y Protección DoS
- **Archivos:**
  - `subasta-backend/pom.xml` (Agregar `bucket4j_jdk17-core`)
  - `subasta-backend/src/main/java/com/subasta/security/UploadRateLimitingFilter.java` (Crear)
  - `subasta-frontend/nginx.conf` (Directivas `limit_req_zone` y `limit_req`)
  - `subasta-backend/src/main/resources/application.properties` (Reducir multipart a 10M/30M)
- **Cambio:** Restringir subidas a máximo 5 solicitudes por minuto por IP con respuesta HTTP 429.
- **Justificación:** Protege la memoria del servidor y el almacenamiento contra saturación.
- **Riesgo de no solucionarlo:** Caída por Out Of Memory (OOM) en la instancia OCI.
- **Verificación:** Enviar 6 peticiones de subida seguidas y comprobar que la 6ta reciba HTTP 429.

### 7. [Prioridad P1] Hardening de CORS y Cabeceras de Seguridad
- **Archivos:**
  - `subasta-backend/src/main/java/com/subasta/security/SecurityConfig.java`
  - `subasta-backend/src/main/java/com/subasta/controller/OnboardingController.java`
  - `subasta-backend/src/main/java/com/subasta/controller/RevisionController.java`
  - `subasta-backend/src/main/java/com/subasta/controller/AuthController.java`
- **Cambio:** Remover `@CrossOrigin("*")` y configurar lista blanca de orígenes permitidos. Habilitar `frameOptions.sameOrigin()`.
- **Justificación:** Mitiga ataques CSRF/CORS y Clickjacking.
- **Riesgo de no solucionarlo:** Ataques de origen cruzado contra sesiones de usuarios.
- **Verificación:** Realizar una petición desde un origen no autorizado (`Origin: https://malicious.com`) y verificar rechazo en cabeceras CORS.

### 8. [Prioridad P1] Manejador Global de Excepciones (`@RestControllerAdvice`)
- **Archivo:** `subasta-backend/src/main/java/com/subasta/exception/GlobalExceptionHandler.java` (Crear)
- **Cambio:** Capturar excepciones de tamaño de archivo (`MaxUploadSizeExceededException`), tipo no soportado, validaciones de Bean y excepciones generales para responder en JSON estándar sin stack traces.
- **Justificación:** Previene fuga de información sobre la arquitectura interna.
- **Riesgo de no solucionarlo:** Revelación de paquetes internos, clases Java y versiones a posibles atacantes.
- **Verificación:** Forzar un error 500 y comprobar que la respuesta sea un JSON limpio sin traza de error Java.

---
**Quedo a la espera de tu autorización para comenzar con la aplicación de los cambios de la Fase de Remediación.**

