# backend/backend-ai/ai_service/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install OCR & build essentials
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    tesseract-ocr \
    libtesseract-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Poetry via pip
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry

# Copy dependency files (relative to current build context, which is apps/ai-service)
COPY pyproject.toml ./
COPY --chown=nonroot:nonroot poetry.lock* ./

# Copy the shared library (relative to current build context: ../../shared/libs/lib2)
COPY ../../shared/libs/lib2 ./lib2

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy app code (relative to current build context)
COPY . .

# Set monorepo-aware import path
ARG PYTHONPATH=""
ENV PYTHONPATH=${PYTHONPATH}:/app

# Entrypoint setup
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
