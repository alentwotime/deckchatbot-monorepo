FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        build-essential \
        git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry

# Copy pyproject and lockfile
COPY pyproject.toml poetry.lock ./

# Add referenced monorepo packages before install
COPY backend/backend-ai/ai-service backend/backend-ai/ai-service
COPY libs/lib2 libs/lib2

# Install Python dependencies (no dev)
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main

# Copy the rest of the backend-ai app
COPY . .

# Set PYTHONPATH so app can import lib2 etc.
ENV PYTHONPATH="${PYTHONPATH}:/app:/app/libs"

# Entry script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
CMD ["/entrypoint.sh"]
