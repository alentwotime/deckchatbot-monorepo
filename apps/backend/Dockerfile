# backend/Dockerfile

# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json for better caching
COPY apps/backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY apps/backend/ ./

# Production stage
FROM node:18-slim AS production

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1001 appuser && \
    mkdir -p /app && \
    chown -R appuser:appuser /app

# Copy application code and node_modules from builder stage
COPY --from=builder --chown=appuser:appuser /app /app

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app/uploads

# Copy and setup entrypoint
COPY --chown=appuser:appuser apps/backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
