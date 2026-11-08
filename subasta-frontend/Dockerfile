# Usa Nginx en su versión Alpine para servir archivos estáticos y proxy inverso al backend
FROM nginx:alpine

# Configuración con proxy inverso hacia el backend de Spring Boot
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia todo el contenido de subasta-frontend dentro del directorio público de Nginx
COPY . /usr/share/nginx/html

# Expón el puerto 80 del contenedor
EXPOSE 80