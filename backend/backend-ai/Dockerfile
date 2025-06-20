# syntax=docker/dockerfile:1

# 🔧 Builder stage: install dependencies and compile wheels
FROM python:3.12-slim AS builder
WORKDIR /app

# Install build tools needed for some packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy dependencies and build them into wheels
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# 🏁 Final stage: minimal runtime image
FROM python:3.12-slim
WORKDIR /app

# Copy built wheels and install
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Copy application code
COPY app.py .

# Non-root user for better security
RUN adduser --system appuser
USER appuser

# Expose your app's port
EXPOSE 8000

# Launch your app
CMD ["python", "app.py"]
