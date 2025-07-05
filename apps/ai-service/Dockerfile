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

# Copy the conversion script
COPY apps/ai-service/convert_deps.py ./

# Install dependencies - with optimizations for disk space
# Install toml package to parse pyproject.toml
RUN pip install --no-cache-dir toml && \
    # Extract dependencies from pyproject.toml and install with pip directly
    python convert_deps.py > requirements.txt && \
    cat requirements.txt && \
    pip install --no-cache-dir -r requirements.txt && \
    # Install whisper and soundfile explicitly
    pip install --no-cache-dir openai-whisper==20231117 soundfile && \
    # Clean pip cache to reduce disk space usage
    pip cache purge && \
    # Remove temporary conversion script
    rm -f convert_deps.py && \
    # Remove unnecessary files to reduce image size
    find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11/site-packages -name "__pycache__" -exec rm -rf {} +

# Production stage
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime dependencies (OCR tools and audio processing tools needed for production)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    ffmpeg \
    libsndfile1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user with proper home directory permissions
RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1001 -m appuser && \
    mkdir -p /app && \
    chown -R appuser:appuser /app && \
    chmod 755 /home && \
    chmod 755 /home/appuser

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
# Copy whisper package for speech recognition
COPY --from=builder /usr/local/lib/python3.11/site-packages/whisper /usr/local/lib/python3.11/site-packages/whisper
# Note: soundfile will be installed directly in the production stage
# Copy torch and related dependencies for whisper
COPY --from=builder /usr/local/lib/python3.11/site-packages/torch /usr/local/lib/python3.11/site-packages/torch
COPY --from=builder /usr/local/lib/python3.11/site-packages/transformers /usr/local/lib/python3.11/site-packages/transformers
COPY --from=builder /usr/local/lib/python3.11/site-packages/tokenizers /usr/local/lib/python3.11/site-packages/tokenizers
COPY --from=builder /usr/local/lib/python3.11/site-packages/huggingface_hub /usr/local/lib/python3.11/site-packages/huggingface_hub
COPY --from=builder /usr/local/lib/python3.11/site-packages/filelock* /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/lib/python3.11/site-packages/regex* /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/lib/python3.11/site-packages/requests* /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/lib/python3.11/site-packages/packaging* /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/lib/python3.11/site-packages/safetensors* /usr/local/lib/python3.11/site-packages/
# Copy additional dependencies that might be required
COPY --from=builder /usr/local/lib/python3.11/site-packages/typing_extensions* /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/lib/python3.11/site-packages/python_multipart /usr/local/lib/python3.11/site-packages/python_multipart

# Ensure whisper is installed correctly and remove Poetry if present
RUN pip install --no-cache-dir openai-whisper==20231117 soundfile && \
    pip uninstall -y poetry poetry-core poetry-plugin-export 2>/dev/null || true && \
    chmod -R 755 /usr/local/lib/python3.11/site-packages

# Copy the shared library
COPY --chown=appuser:appuser shared/libs/lib2/lib2 ./lib2

# Copy only the necessary AI service app code (excluding Poetry files)
COPY --chown=appuser:appuser apps/ai-service/ai_service ./ai_service
# Copy any other necessary files but exclude Poetry-related files
COPY --chown=appuser:appuser apps/ai-service/README.md* ./

# Set monorepo-aware import path and environment variables
ENV PYTHONPATH="/app" \
    HOME="/home/appuser" \
    PIP_NO_CACHE_DIR=1 \
    # Completely disable Poetry by setting environment variables
    POETRY_DISABLED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_VIRTUALENVS_IN_PROJECT=false \
    POETRY_NO_INTERACTION=1 \
    POETRY_CACHE_DIR="/tmp/poetry_cache" \
    # Disable virtualenv creation
    VIRTUALENV_SYSTEM_SITE_PACKAGES=true \
    VIRTUAL_ENV_DISABLE_PROMPT=1 \
    # Additional environment variables to prevent virtualenv creation
    POETRY_VIRTUALENVS_PATH="/tmp/poetry_venvs" \
    POETRY_VIRTUALENVS_OPTIONS_ALWAYS_COPY=true \
    POETRY_VIRTUALENVS_OPTIONS_NO_PIP=true \
    POETRY_VIRTUALENVS_OPTIONS_NO_SETUPTOOLS=true

# Copy and setup entrypoint
COPY --chown=appuser:appuser apps/ai-service/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create and set permissions for home directory and cache directories
RUN mkdir -p /home/appuser && \
    mkdir -p /home/appuser/.cache && \
    mkdir -p /home/appuser/.cache/pip && \
    mkdir -p /tmp/poetry_cache && \
    mkdir -p /tmp/poetry_venvs && \
    mkdir -p /tmp/runtime && \
    # Set very permissive permissions for all directories
    chown -R appuser:appuser /home/appuser && \
    chmod -R 777 /home/appuser && \
    chmod -R 777 /home/appuser/.cache && \
    chmod -R 777 /home/appuser/.cache/pip && \
    chmod -R 777 /tmp/poetry_cache && \
    chmod -R 777 /tmp/poetry_venvs && \
    chmod -R 777 /tmp/runtime && \
    # Completely remove Poetry and virtualenv-related packages
    pip uninstall -y poetry poetry-core poetry-plugin-export virtualenv 2>/dev/null || true && \
    pip freeze | grep -i poetry | xargs -r pip uninstall -y 2>/dev/null || true && \
    pip freeze | grep -i virtualenv | xargs -r pip uninstall -y 2>/dev/null || true && \
    # Remove any remaining Poetry files
    rm -rf /home/appuser/.poetry /home/appuser/.config/pypoetry /home/appuser/.cache/pypoetry 2>/dev/null || true && \
    rm -rf /root/.poetry /root/.config/pypoetry /root/.cache/pypoetry 2>/dev/null || true && \
    find / -name "poetry.lock" -delete 2>/dev/null || true && \
    find / -name "pyproject.toml" -delete 2>/dev/null || true && \
    # Make sure whisper and soundfile are properly installed and accessible
    pip install --no-cache-dir --force-reinstall openai-whisper==20231117 soundfile && \
    # Set permissions for all Python site-packages to ensure they're writable
    chmod -R 777 /usr/local/lib/python3.11/site-packages && \
    # Ensure HOME is properly set in .bashrc
    echo 'export HOME="/home/appuser"' > /home/appuser/.bashrc && \
    # Disable Poetry in .bashrc
    echo 'export POETRY_DISABLED=1' >> /home/appuser/.bashrc && \
    echo 'export POETRY_VIRTUALENVS_CREATE=false' >> /home/appuser/.bashrc

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
