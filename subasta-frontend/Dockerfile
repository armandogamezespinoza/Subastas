
# Usa Nginx en su versión Alpine (muy ligera) para servir archivos estáticos
FROM nginx:alpine

# Copia todo el contenido de subasta-frontend dentro del directorio público de Nginx
COPY . /usr/share/nginx/html

# Expón el puerto 80 del contenedor
EXPOSE 80