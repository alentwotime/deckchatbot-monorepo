# backend/backend-ai/Dockerfile

# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry

# Copy dependency definition files first for better caching
COPY pyproject.toml poetry.lock* ./
COPY apps/backend/pyproject.toml apps/backend/poetry.lock* ./apps/backend/
COPY apps/ai-service/pyproject.toml apps/ai-service/poetry.lock* ./apps/ai-service/
COPY shared/libs/lib2/pyproject.toml ./shared/libs/lib2/

# Copy all application and library code
COPY apps ./apps
COPY shared ./shared

# Change to the backend directory and install dependencies
WORKDIR /app/apps/backend
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Production stage
FROM python:3.11-slim AS production

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

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=appuser:appuser apps ./apps
COPY --chown=appuser:appuser shared ./shared

# Set monorepo-aware import path
ENV PYTHONPATH="/app"

# Copy and setup entrypoint
COPY --chown=appuser:appuser apps/backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
