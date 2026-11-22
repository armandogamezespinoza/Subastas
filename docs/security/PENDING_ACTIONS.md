# Acciones Pendientes y Tareas de Intervención Humana (Pending Actions)
**Proyecto:** Plataforma Subasta  
**Fecha:** 15 de Noviembre de 2026  
**Rama:** `audit/security-and-production-readiness`  

> [!IMPORTANT]
> Las siguientes tareas involucran sistemas externos, cuentas personales de servicios en la nube o decisiones de arquitectura que **no pueden ni deben ser ejecutadas de forma automatizada por un agente sin la intervención directa del propietario del proyecto**.

---

## 1. Rotación de Secretos Expuestos Históricamente

### 1.1. Revocación y Rotación de Contraseña de Aplicación de Gmail (SMTP)
- **Causa:** En el commit `3700b1a` se incluyó una contraseña de aplicación de Gmail dentro de `application.yml`. Aunque el archivo fue eliminado del árbol de trabajo actual, el valor permanece visible en el historial inmutable de Git.
- **Acción Humana Requerida:**
  1. Iniciar sesión en la cuenta de Google vinculada.
  2. Ir a **Gestionar tu cuenta de Google > Seguridad > Verificación en dos pasos > Contraseñas de aplicaciones**.
  3. **Revocar (eliminar)** de inmediato la contraseña de aplicación previamente generada.
  4. Generar una nueva contraseña de aplicación exclusiva para la plataforma Subasta.
  5. Colocar el nuevo valor únicamente en el archivo `.env` de producción o en los GitHub Actions Secrets (como `MAIL_PASSWORD`), **nunca en código fuente ni en commits**.

### 1.2. Rotación de Clave Secreta JWT (`JWT_SECRET`)
- **Causa:** El secreto utilizado como fallback en `JwtService.java` y `application.yml` fue expuesto en commits históricos.
- **Acción Humana Requerida:**
  1. Generar un nuevo secreto criptográfico seguro de al menos 256 bits mediante el comando:
     ```bash
     openssl rand -hex 32
     ```
  2. Asignar dicho valor a la variable de entorno `JWT_SECRET` en el archivo `.env` del servidor de producción y en los secretos del repositorio.

---

## 2. Decisiones de Infraestructura y Red en Oracle Cloud Infrastructure (OCI)

### 2.1. Gestión de DNS y Certificados TLS (HTTPS)
- **Situación Actual:** El contenedor Nginx está preparado y configurado en el puerto 80 (HTTP) para desarrollo local. En producción, la transmisión de credenciales y documentos sensibles a través de HTTP sin cifrar expone los datos a ataques de intermediario (Man-in-the-Middle).
- **Acción Humana Requerida:**
  1. Adquirir o vincular un nombre de dominio (p. ej. `subasta.tudominio.com`) hacia la IP pública fija de la instancia OCI.
  2. Añadir la terminación HTTPS en Nginx mediante Certbot (Let's Encrypt) o utilizar un OCI Load Balancer administrado con certificado SSL gratuito gestionado por Oracle Cloud.

### 2.2. Configuración de Ingress Rules en OCI Security Lists
- **Acción Humana Requerida:**
  - En la consola de OCI (`Networking > Virtual Cloud Networks > VCN > Security Lists`):
    - **Permitir Entrada:** Puerto `80` (HTTP) y `443` (HTTPS) desde `0.0.0.0/0`.
    - **Permitir Entrada:** Puerto `22` (SSH) restringido a tu dirección IP pública.
    - **PROHIBIDO:** No abrir los puertos `8080` (Tomcat) ni `5432` (PostgreSQL).

---

## 3. Decisiones de Arquitectura y Persistencia

### 3.1. Migración de Hibernate `ddl-auto=update` a Versionado de Esquemas
- **Situación Actual:** `subasta-backend/src/main/resources/application.properties` mantiene `spring.jpa.hibernate.ddl-auto=update`.
- **Riesgo:** En entornos de producción multi-instancia o durante despliegues automatizados, `update` puede realizar cambios automáticos sobre tablas con datos reales, bloquear secuencias o generar desalineaciones.
- **Acción Futura Recomendada:**
  - Adoptar **Flyway** o **Liquibase** en una fase posterior.
  - Exportar el esquema actual a un script SQL inicial `V1__init.sql`.
  - Configurar `spring.jpa.hibernate.ddl-auto=validate` para garantizar que la aplicación únicamente valide la estructura de la base de datos sin alterarla.

### 3.2. Estrategia de Almacenamiento a Largo Plazo
- **Situación Actual:** Los documentos se almacenan localmente en el volumen persistente Docker `backend_uploads`.
- **Evaluación:** Para una única máquina virtual en OCI Always Free, este esquema es eficiente, económico y estable. Si en el futuro se planea escalar horizontalmente a múltiples instancias backend detrás de un balanceador de carga, se deberá migrar a **OCI Object Storage** mediante su SDK o compatible con S3.

