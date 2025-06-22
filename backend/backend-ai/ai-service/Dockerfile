# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install Poetry and project dependencies
COPY backend/ai-service/pyproject.toml backend/ai-service/poetry.lock ./
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl build-essential && \
    curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-root && \
    apt-get purge -y curl && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Copy application source code
COPY backend/ai-service /app

# Expose port
EXPOSE 11434

# Run app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "11434"]
