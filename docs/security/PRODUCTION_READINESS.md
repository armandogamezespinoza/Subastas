# Evaluación de Preparación para Producción (Production Readiness)
**Proyecto:** Plataforma Subasta  
**Fecha de Evaluación:** 15 de Noviembre de 2026  
**Entorno Objetivo:** Oracle Cloud Infrastructure (OCI) Always Free Tier (Ampere A1 ARM64)  
**Dictamen General:** **`CONDICIONALMENTE LISTO PARA TRANSICIÓN A CI/CD`**

---

## 1. Estado por Componente

### A. Backend (Spring Boot 3.3.4 + Java 21)
- **Estado:** **ESTABLE Y ENDURECIDO**.
- **Autenticación y Sesiones:** Autenticación sin estado vía JWT (firmado con clave robusta de mínimo 256 bits). El mensaje de autoconfiguración de usuario en memoria ha sido eliminado.
- **Autorización y RBAC:** Se han cerrado las brechas IDOR/BOLA. El acceso a expedientes de identidad requiere autenticación y valida la propiedad del recurso. Roles administrativos (`ADMINISTRADOR`, `APROBADOR`, `CONTROLER`) controlan la gestión global.
- **Gestión de Archivos:** Apache Tika inspecciona firmas binarias (magic bytes) en tiempo real, bloqueando extensiones no permitidas y ejecutables camuflados. Normalización de rutas contra Path Traversal.
- **Manejo de Excepciones:** `GlobalExceptionHandler` captura errores de tamaño, tipos de medios, validación y excepciones internas sin filtrar stack traces.
- **Resiliencia:** HikariCP configurado con timeout de reconexión y endpoint `/api/v1/health` disponible para monitoreo.

### B. Frontend (Vanilla JS + HTML5 + CSS)
- **Estado:** **ESTABLE (74 tests unitarios pasando al 100%)**.
- **Seguridad en DOM:** Las inserciones dinámicas utilizan `escapeHtml()` para mitigar Cross-Site Scripting (XSS).
- **Control de Flujo:** Validación de correo previa a la sumisión de formularios con tokens de verificación efímeros.
- **Navegación Protegida:** Guardas de ruta en cliente bloquean la vista de solicitudes para roles sin privilegios.
- **Integridad:** Sin dependencias de frameworks pesados, minimizando la superficie de ataque del cliente.

### C. Base de Datos (PostgreSQL 15 Alpine)
- **Estado:** **ENDURECIDO CON MÍNIMO PRIVILEGIO**.
- **Aislamiento de Red:** Puerto `5432` no publicado en el host; tráfico confinado a la red interna Docker.
- **Roles:** Separación estricta entre el superusuario de inicialización `postgres` y el usuario operativo `subasta_app` (`NOSUPERUSER`).
- **Persistencia:** Volumen `pgdata` conservado y desacoplado del ciclo de vida de los contenedores.
- **Observación para Producción:** Hibernate opera con `ddl-auto=update`. Se recomienda migrar a herramientas de versionado de esquemas (Flyway) antes del pase final a producción.

### D. Docker y Docker Compose
- **Estado:** **OPTIMIZADO Y SINCRONIZADO**.
- **Seguridad en Ejecución:** El contenedor backend corre con usuario sin privilegios `appuser:appgroup` (UID 1001). Se utiliza `su-exec` en el script de arranque para reconciliar la propiedad del volumen `/app/uploads`.
- **Healthchecks:** Los tres servicios cuentan con comprobaciones de salud nativas (`pg_isready`, `wget` al healthcheck del backend y `wget` al frontend).
- **Dependencias Condicionales:** `backend` espera a que `postgres` esté saludable (`condition: service_healthy`); `frontend` espera a que `backend` esté saludable. Esto elimina la causa raíz de errores 502 Bad Gateway y reinicios en cascada.
- **Límites de Recursos:** Asignación de topes de memoria en `deploy.resources.limits` para prevenir saturación de RAM en la máquina virtual OCI.

### E. Proxy Inverso Nginx
- **Estado:** **ENDURECIDO CON POLÍTICAS DE SEGURIDAD**.
- **Cabeceras HTTP:** Implementadas `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Referrer-Policy` y `Content-Security-Policy`.
- **Protección de Servidor:** `server_tokens off;` oculta la versión del servidor web.
- **Protección de Archivos:** Denegación explícita (HTTP 404) para archivos ocultos (`.env`, `.git`) y artefactos de desarrollo (`.json`, `.lock`, `.md`, `.dockerfile`).
- **Control de Tasa (Rate Limiting):** Zona estricta para autenticación (`10r/m` con ráfaga de 5) y zona para API general (`20r/s`).

---

## 2. Matriz de Riesgos Residuales

| Riesgo Residual | Impacto | Probabilidad | Estrategia de Mitigación / Acción Requerida |
|---|---|---|---|
| **Secretos expuestos en commits antiguos de Git** | Alto | Media | Rotar la contraseña de aplicación de Gmail y generar nuevo secreto JWT antes de publicar en OCI. |
| **Tráfico HTTP sin cifrar en puerto 80** | Alto | Alta | Configurar terminación TLS con certificados Let's Encrypt / Certbot al asignar dominio público en OCI. |
| **Uso de `ddl-auto=update` en base de datos** | Medio | Baja | En una etapa futura, adoptar Flyway o Liquibase y cambiar a `ddl-auto=validate`. |
| **Almacenamiento de archivos en disco local de la VM** | Medio | Baja | En despliegues multi-instancia futuros, evaluar OCI Object Storage; para la etapa actual con una sola VM, el volumen persistente Docker es adecuado. |

---

## 3. Requisitos Previos al Despliegue en OCI

Antes de iniciar el despliegue en la máquina virtual de Oracle Cloud Infrastructure, se deben completar los siguientes pasos en la infraestructura:

1. **Aprovisionamiento de Instancia:**
   - OCI Compute: `VM.Standard.A1.Flex` (Ampere ARM64, 4 OCPUs, 24 GB RAM en Always Free) o `VM.Standard.E2.1.Micro` (AMD x86).
   - Sistema Operativo recomendado: Ubuntu 22.04 LTS o Oracle Linux 9.

2. **Configuración de Red (VCN y Security Lists):**
   - Ingress Rules en la VCN / NSG:
     - Puerto `22/TCP` (SSH restringido a tu IP pública o vía OCI Bastion Service).
     - Puerto `80/TCP` (HTTP público para validación de retos Certbot Let's Encrypt).
     - Puerto `443/TCP` (HTTPS público para todo el tráfico de usuarios).
     - **PROHIBIDO:** Abrir puertos `5432` o `8080` en las Security Lists de OCI.

3. **Gestión Segura de Variables de Entorno en el Host:**
   - Crear el archivo `.env` en la máquina de OCI fuera del control de versiones.
   - Generar claves criptográficas aleatorias:
     ```bash
     # Generar secreto JWT de 256 bits
     openssl rand -hex 32
     # Generar contraseñas seguras para BD
     openssl rand -base64 24
     ```

4. **Certificado SSL/TLS con Certbot:**
   - Apuntar el dominio o subdominio DNS a la IP pública de la instancia en OCI.
   - Emitir certificado SSL con Let's Encrypt e integrarlo en la configuración de Nginx.

