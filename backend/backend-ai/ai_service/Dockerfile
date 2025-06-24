# backend/backend-ai/ai-service/Dockerfile (or wherever it's located)

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

# Install Poetry and set up environment
COPY backend/backend-ai/ai_service/pyproject.toml backend/backend-ai/ai_service/poetry.lock ./
# Include shared libraries for path dependencies before installing
COPY libs/lib2 libs/lib2
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy your app code
COPY . .

# Optional: if you use monorepo imports
# Add the ai_service source directory and libs so uvicorn can locate the module
ARG PYTHONPATH=""
ENV PYTHONPATH=${PYTHONPATH}:/app:/app/backend/backend-ai/ai_service:/app/libs

# Set port and start
ENV PORT=8000
EXPOSE ${PORT}

# Safer CMD for Render
CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
