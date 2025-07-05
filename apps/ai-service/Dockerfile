# backend/backend-ai/ai_service/Dockerfile

# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libtesseract-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir poetry

# Copy dependency files (paths are relative to the monorepo root)
COPY apps/ai-service/pyproject.toml ./
COPY apps/ai-service/poetry.lock* ./

# Copy the shared library (path is relative to the monorepo root)
COPY shared/libs/lib2/lib2 ./lib2

# Install dependencies - with optimizations for disk space
RUN poetry config virtualenvs.create false && \
    # Update lock file if pyproject.toml has changed
    poetry lock && \
    # Install only main dependencies, no dev dependencies
    poetry install --no-root --only main && \
    # Clean pip cache to reduce disk space usage
    pip cache purge && \
    # Remove unnecessary files to reduce image size
    find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11/site-packages -name "__pycache__" -exec rm -rf {} +

# Production stage
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime dependencies (OCR tools needed for production)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1001 appuser && \
    mkdir -p /app && \
    chown -R appuser:appuser /app

# Copy Python packages from builder stage - selectively to reduce disk space usage
# Copy only the necessary packages instead of the entire site-packages directory
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/
COPY --from=builder /usr/local/bin/python /usr/local/bin/
COPY --from=builder /usr/local/bin/pip /usr/local/bin/
COPY --from=builder /usr/local/lib/python3.11/site-packages/fastapi /usr/local/lib/python3.11/site-packages/fastapi
COPY --from=builder /usr/local/lib/python3.11/site-packages/pydantic /usr/local/lib/python3.11/site-packages/pydantic
COPY --from=builder /usr/local/lib/python3.11/site-packages/starlette /usr/local/lib/python3.11/site-packages/starlette
COPY --from=builder /usr/local/lib/python3.11/site-packages/uvicorn /usr/local/lib/python3.11/site-packages/uvicorn
COPY --from=builder /usr/local/lib/python3.11/site-packages/httpx /usr/local/lib/python3.11/site-packages/httpx
COPY --from=builder /usr/local/lib/python3.11/site-packages/PIL /usr/local/lib/python3.11/site-packages/PIL
COPY --from=builder /usr/local/lib/python3.11/site-packages/pytesseract /usr/local/lib/python3.11/site-packages/pytesseract
COPY --from=builder /usr/local/lib/python3.11/site-packages/cv2 /usr/local/lib/python3.11/site-packages/cv2
COPY --from=builder /usr/local/lib/python3.11/site-packages/numpy /usr/local/lib/python3.11/site-packages/numpy
COPY --from=builder /usr/local/lib/python3.11/site-packages/tqdm /usr/local/lib/python3.11/site-packages/tqdm
COPY --from=builder /usr/local/lib/python3.11/site-packages/chromadb /usr/local/lib/python3.11/site-packages/chromadb
COPY --from=builder /usr/local/lib/python3.11/site-packages/sentence_transformers /usr/local/lib/python3.11/site-packages/sentence_transformers
# Copy additional dependencies that might be required
COPY --from=builder /usr/local/lib/python3.11/site-packages/typing_extensions* /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/lib/python3.11/site-packages/python_multipart /usr/local/lib/python3.11/site-packages/python_multipart

# Copy the shared library
COPY --chown=appuser:appuser shared/libs/lib2/lib2 ./lib2

# Copy only the necessary AI service app code (excluding Poetry files)
COPY --chown=appuser:appuser apps/ai-service/ai_service ./ai_service
# Copy any other necessary files but exclude Poetry-related files
COPY --chown=appuser:appuser apps/ai-service/README.md* ./

# Set monorepo-aware import path
ENV PYTHONPATH="/app"

# Copy and setup entrypoint
COPY --chown=appuser:appuser apps/ai-service/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create and set permissions for home directory
RUN mkdir -p /home/appuser && \
    chown -R appuser:appuser /home/appuser

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
