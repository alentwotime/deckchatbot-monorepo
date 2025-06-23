# backend/Dockerfile or backend/backend-ai/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl build-essential git && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry

# Set Poetry config + install dependencies
COPY pyproject.toml poetry.lock ./
COPY backend/backend-ai ./backend/backend-ai
COPY backend/app2 ./backend/app2
COPY backend/backend-ai/ai-service ./backend/backend-ai/ai-service
COPY libs/lib2 ./libs/lib2
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --without dev

# Copy source files
COPY . .

# Entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 11434
CMD ["/entrypoint.sh"]
