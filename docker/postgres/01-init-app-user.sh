#!/bin/bash
set -e

# Creación de usuario de aplicación con mínimo privilegio (NO SUPERUSUARIO)
APP_USER="${APP_DB_USER:-subasta_app}"
APP_PASS="${APP_DB_PASSWORD:-${POSTGRES_PASSWORD}}"
DB_NAME="${POSTGRES_DB:-Subasta}"

echo "Configurando usuario con minimo privilegio para la aplicacion: $APP_USER..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
            CREATE ROLE $APP_USER WITH LOGIN PASSWORD '$APP_PASS' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
        ELSE
            ALTER ROLE $APP_USER WITH PASSWORD '$APP_PASS';
        END IF;
    END
    \$\$;

    GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO $APP_USER;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB_NAME" <<-EOSQL
    GRANT ALL ON SCHEMA public TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $APP_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;
EOSQL

echo "Usuario $APP_USER configurado exitosamente."

