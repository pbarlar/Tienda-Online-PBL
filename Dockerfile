FROM nginx:alpine

# Eliminar config por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra config
COPY nginx/default.conf /etc/nginx/conf.d/

# Copiar frontend
COPY src/ /usr/share/nginx/html/

# Copiar documentación generada
COPY docs/ /usr/share/nginx/html/documentacion/

# Seguridad: usuario no root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Crear directorios necesarios y asignar permisos
RUN mkdir -p /var/run/nginx \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && chown -R appuser:appgroup /etc/nginx/conf.d \
    && chown -R appuser:appgroup /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html \
    && touch /var/run/nginx.pid \
    && chown -R appuser:appgroup /var/run/nginx.pid \
    && chown -R appuser:appgroup /var/run/nginx
USER appuser

EXPOSE 80
