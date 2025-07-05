# backend/backend-ai/ai_service/Dockerfile

# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libtesseract-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry

# Copy dependency files (paths are relative to the monorepo root)
COPY apps/ai-service/pyproject.toml ./
COPY apps/ai-service/poetry.lock* ./

# Copy the shared library (path is relative to the monorepo root)
COPY shared/libs/lib2/lib2 ./lib2

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Production stage
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime dependencies (OCR tools needed for production)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr && \
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

# Copy the shared library
COPY --chown=appuser:appuser shared/libs/lib2/lib2 ./lib2

# Copy the AI service app code
COPY --chown=appuser:appuser apps/ai-service/ .

# Set monorepo-aware import path
ENV PYTHONPATH="/app"

# Copy and setup entrypoint
COPY --chown=appuser:appuser apps/ai-service/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Configure Poetry to not create virtualenvs
RUN mkdir -p /home/appuser/.config/pypoetry && \
    echo '[virtualenvs]' > /home/appuser/.config/pypoetry/config.toml && \
    echo 'create = false' >> /home/appuser/.config/pypoetry/config.toml && \
    chown -R appuser:appuser /home/appuser

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
