# Multi-stage build with Node.js 18 Alpine
FROM node:18-alpine AS builder

WORKDIR /app

# Install image processing dependencies and security updates
RUN apk update && \
    apk add --no-cache \
    # Image processing dependencies
    imagemagick \
    imagemagick-dev \
    graphicsmagick \
    vips \
    vips-dev \
    # Build dependencies
    python3 \
    make \
    g++ \
    # Security and utilities
    curl \
    ca-certificates && \
    # Clean up
    rm -rf /var/cache/apk/*

# Create non-root user for build stage
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy frontend dependency manifests first for better caching
COPY apps/frontend/package*.json ./apps/frontend/
WORKDIR /app/apps/frontend

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci && \
    npm cache clean --force

# Copy the rest of the frontend source
COPY apps/frontend/ ./

# Build the application
RUN npm run build && \
    # Remove development dependencies and clean up
    rm -rf node_modules && \
    npm ci --only=production && \
    npm cache clean --force

# Production stage with security best practices
FROM nginx:stable-alpine

# Install image processing dependencies and security updates
RUN apk update && \
    apk add --no-cache \
    # Image processing dependencies for runtime
    imagemagick \
    graphicsmagick \
    vips \
    # Health check utilities
    curl \
    # Security updates
    ca-certificates && \
    # Clean up
    rm -rf /var/cache/apk/*

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder --chown=nginx-user:nginx-user /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Update nginx configuration to run as non-root user
RUN sed -i 's/user nginx;/user nginx-user;/' /etc/nginx/nginx.conf && \
    # Set PID file to a writable location
    sed -i 's|pid.*|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf && \
    # Create necessary directories with proper permissions
    mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /var/log/nginx /var/run && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx

# Security best practices
RUN # Remove unnecessary packages and files \
    apk del --purge && \
    # Set proper file permissions
    chmod -R 755 /usr/share/nginx/html && \
    # Remove shell access for nginx user (security)
    sed -i 's|/bin/ash|/sbin/nologin|' /etc/passwd

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Switch to non-root user
USER nginx-user

EXPOSE 80

# Use exec form for better signal handling
CMD ["nginx", "-g", "daemon off;"]
