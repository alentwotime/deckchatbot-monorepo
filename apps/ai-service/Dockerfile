# backend/backend-ai/ai_service/Dockerfile

FROM python:3.11-slim

# Copy the entire 'apps' directory from the build context to /apps in the image
COPY apps/ /apps

# Set the working directory to the AI service app within /apps
WORKDIR /apps/ai-service

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

# Copy dependency files (now relative to WORKDIR /apps/ai-service)
COPY pyproject.toml ./
COPY --chown=nonroot:nonroot poetry.lock* ./

# Copy the shared library (now relative to WORKDIR /apps/ai-service)
COPY ../../shared/libs/lib2 ./lib2

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Entrypoint setup (now relative to WORKDIR /apps/ai-service)
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
