# Frontend Dockerfile Fix
# Addresses nginx permission issues

FROM nginx:alpine

# Create nginx user and required directories with proper permissions
RUN addgroup -g 101 -S nginx \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx \
    && mkdir -p /var/cache/nginx /var/log/nginx /tmp/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /tmp/nginx \
    && chmod -R 755 /var/cache/nginx /var/log/nginx /tmp/nginx

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy frontend static files
COPY dist/ /usr/share/nginx/html/

# Ensure nginx user owns the html directory
RUN chown -R nginx:nginx /usr/share/nginx/html

# Use non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]