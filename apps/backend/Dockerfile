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

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# ⛓️ Copy only local packages referenced by pyproject.toml before install
COPY ../../shared/libs/lib2 ./libs/lib2

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# 🔄 Copy actual backend-ai app contents (now safe to copy everything)
COPY . .

# Set monorepo-aware import path
ARG PYTHONPATH=""
ENV PYTHONPATH=${PYTHONPATH}:/app:/app/libs

# Entrypoint setup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "backend_ai.main:app", "--host", "0.0.0.0", "--port", "8000"]
