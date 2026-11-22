#!/bin/sh
set -e

# Asegurar que el directorio de uploads montado pertenezca a appuser
mkdir -p /app/uploads
chown -R appuser:appgroup /app/uploads

# Ejecutar la aplicacion con usuario no privilegiado (Least Privilege)
exec su-exec appuser java -jar app.jar "$@"

