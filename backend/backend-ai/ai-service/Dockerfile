FROM python:3.11-slim

WORKDIR /app

# Install Poetry and build dependencies
COPY pyproject.toml poetry.lock ./
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl build-essential && \
    curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-root --no-dev && \   # ⬅️ optional: skip dev deps
    apt-get purge -y curl && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Add your app code
COPY . /app

# Expose the API port
EXPOSE 11434

# Start the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "11434"]
