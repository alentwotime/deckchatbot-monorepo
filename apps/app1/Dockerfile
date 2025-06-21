# syntax=docker/dockerfile:1

# 🔧 Build stage
FROM python:3.11-slim AS builder
WORKDIR /app

# Install build tools and deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# 🏁 Runtime stage
FROM python:3.11-slim
WORKDIR /app

# Install wheels and clean up
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Copy code
COPY API /app/API
COPY ai-service /app/ai-service
COPY requirements.txt .

# Security: Use a non-root user
RUN adduser --system appuser
USER appuser

ENV PORT=8000
CMD ["sh", "-c", "uvicorn API.api:app --host 0.0.0.0 --port ${PORT}"]
