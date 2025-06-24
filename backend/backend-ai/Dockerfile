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

# ⛓️ Copy only local packages referenced by pyproject.toml before install
COPY ./ai-service ./ai-service
COPY ../../libs/lib2 ./libs/lib2

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# 🔄 Copy actual backend-ai app contents (now safe to copy everything)
COPY . .

# Set monorepo-aware import path
ENV PYTHONPATH="${PYTHONPATH}:/app:/app/libs"

# Entrypoint setup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

CMD ["/entrypoint.sh"]
