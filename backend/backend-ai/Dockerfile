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

# Install Poetry globally
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# 👇 Add lib2 before install so poetry can resolve it
COPY ../../libs/lib2 ./libs/lib2

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy application files (FastAPI app)
COPY . .

# Ensure lib2 can be imported (monorepo context)
ENV PYTHONPATH="${PYTHONPATH}:/app:/app/../.."

# Add and prepare entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

# Use the entrypoint
CMD ["/entrypoint.sh"]
