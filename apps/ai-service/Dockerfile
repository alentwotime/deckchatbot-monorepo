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

# Copy ai-service's pyproject and lockfile
COPY pyproject.toml poetry.lock ./

# Copy shared libs needed for install
COPY ../../shared/libs/lib2 ./libs/lib2

# Install poetry + deps
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy app code
COPY ai_service ./ai_service

# Optional: set PYTHONPATH
ARG PYTHONPATH=""
ENV PYTHONPATH=${PYTHONPATH}:/app:/app/ai_service:/app/libs

ENV PORT=8000
EXPOSE ${PORT}

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
