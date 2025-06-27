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

# --- Install Ollama and download Llama-Llava model ---
# Download Ollama
RUN curl -L https://ollama.com/download/ollama-linux-amd64 -o /usr/bin/ollama && \
    chmod +x /usr/bin/ollama

# Pull the Llama-Llava model (assuming llava-deckbot as per main.py)
# This will make the image significantly larger
ENV OLLAMA_HOST=0.0.0.0:11434
RUN ollama serve &\
    while ! curl http://0.0.0.0:11434/api/tags; do sleep 1; done && \
    ollama pull llava-deckbot && \
    kill $(jobs -p)
# --- End Ollama installation ---

# Copy dependency files (paths are relative to the monorepo root)
COPY apps/ai-service/pyproject.toml ./
COPY --chown=nonroot:nonroot apps/ai-service/poetry.lock* ./

# Copy the shared library (path is relative to the monorepo root)
COPY shared/libs/lib2/lib2 ./lib2

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy the rest of the AI service app code
COPY apps/ai-service/ .

# Set monorepo-aware import path
ARG PYTHONPATH=""
ENV PYTHONPATH=${PYTHONPATH}:/app

# Update entrypoint to start Ollama server in background
RUN echo '#!/bin/bash
ollama serve & \
poetry run uvicorn ai_service.main:app --host 0.0.0.0 --port 8000' > entrypoint.sh && \
    chmod +x entrypoint.sh

EXPOSE 8000
EXPOSE 11434 # Expose Ollama port

CMD ["./entrypoint.sh"]
