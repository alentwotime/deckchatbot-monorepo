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

# ⛓️ Copy local monorepo dependencies used in pyproject.toml
COPY backend/backend-ai ./backend/backend-ai
COPY backend/app2 ./backend/app2
COPY backend/backend-ai/ai-service ./backend/backend-ai/ai-service
COPY libs/lib2 ./libs/lib2

# Install dependencies via Poetry
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy application files (FastAPI app + extras)
COPY . .

# Ensure lib2 and others can be imported correctly
ENV PYTHONPATH="${PYTHONPATH}:/app:/app/backend:/app/libs"

# Add and prepare entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

CMD ["/entrypoint.sh"]
