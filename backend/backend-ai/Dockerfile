# syntax=docker/dockerfile:1

# 🔧 Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# 🏁 Final stage
FROM python:3.12-slim
WORKDIR /app

COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# 👇 Copy your actual code
COPY API /app/API
COPY ai-service /app/ai-service
COPY requirements.txt .

# Non-root user
RUN adduser --system appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "API.api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
