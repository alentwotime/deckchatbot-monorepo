# backend/backend-ai/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install essential system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry via pip
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry

# Copy dependency definition files to leverage caching
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

# Set monorepo-aware import path
ENV PYTHONPATH="/app"

# Entrypoint setup
RUN chmod +x entrypoint.sh

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "backend_ai.main:app", "--host", "0.0.0.0", "--port", "8000"]
