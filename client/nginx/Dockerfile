FROM nginx:alpine

# Add security packages
RUN apk add --no-cache openssl

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /tmp \
    && touch /tmp/nginx.pid \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /tmp/nginx.pid

# Copy configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Security hardening
RUN chmod 644 /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /etc/nginx

# Expose HTTP port
EXPOSE 80

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Run as nginx user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
