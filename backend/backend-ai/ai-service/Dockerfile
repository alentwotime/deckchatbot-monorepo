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
COPY pyproject.toml poetry.lock ./
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-root

# Copy your app code
COPY . .

# Optional: if you use monorepo imports
ENV PYTHONPATH="${PYTHONPATH}:/app:/app/../.."

# Set port and start
ENV PORT=8000
EXPOSE ${PORT}

# Safer CMD for Render
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
