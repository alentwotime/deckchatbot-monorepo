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

# Copy pyproject.toml and poetry.lock directly from current dir
COPY pyproject.toml poetry.lock ./

# Include shared libraries for path dependencies
# The ai_service build context is the repository root, so the shared
# library lives in backend/backend-ai/libs. Explicitly copy it from
# that location so it is available for path dependencies defined in
# pyproject.toml.
COPY backend/backend-ai/libs/lib2 libs/lib2

# Install Poetry and Python deps
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy service code
COPY . .

# Optional monorepo path setup
ARG PYTHONPATH=""
ENV PYTHONPATH=${PYTHONPATH}:/app:/app/ai_service:/app/libs

# Expose and run
ENV PORT=8000
EXPOSE ${PORT}

CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
