FROM node:22-alpine AS builder
WORKDIR /app

# Create non-root user for build stage
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy frontend dependency manifests first for better caching
COPY apps/frontend/package*.json ./apps/frontend/
WORKDIR /app/apps/frontend

# Install dependencies with clean cache
RUN npm ci --only=production && \
    npm cache clean --force

# Copy the rest of the frontend source
COPY apps/frontend/ ./

# Build the application
RUN npm run build && \
    # Remove development dependencies and clean up
    rm -rf node_modules && \
    npm ci --only=production && \
    npm cache clean --force

FROM nginx:stable-alpine

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
    # Create necessary directories with proper permissions
    mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Switch to non-root user
USER nginx-user

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
