#!/usr/bin/env bash
set -e

# Set HOME to a writable location
export HOME="/tmp/runtime"

# Ensure we're using the correct Python path
export PYTHONPATH="/app:${PYTHONPATH}"

# Completely disable Poetry and virtualenv creation
export POETRY_VIRTUALENVS_CREATE=false
export POETRY_VIRTUALENVS_IN_PROJECT=false
export POETRY_NO_INTERACTION=1
export POETRY_CACHE_DIR="/dev/null"
export VIRTUAL_ENV_DISABLE_PROMPT=1
export VIRTUALENV_SYSTEM_SITE_PACKAGES=true
export POETRY_VIRTUALENVS_PATH="/dev/null"
export POETRY_VIRTUALENVS_OPTIONS_ALWAYS_COPY=true
export POETRY_VIRTUALENVS_OPTIONS_NO_PIP=true
export POETRY_VIRTUALENVS_OPTIONS_NO_SETUPTOOLS=true

# Make sure the runtime directory exists and is writable
mkdir -p /tmp/runtime
chmod 777 /tmp/runtime

# Completely remove Poetry and virtualenv if found
if command -v poetry &> /dev/null || command -v virtualenv &> /dev/null; then
    echo "Warning: Poetry or virtualenv is still installed. Removing now..."
    pip uninstall -y poetry poetry-core poetry-plugin-export virtualenv 2>/dev/null || true
    pip freeze | grep -i poetry | xargs -r pip uninstall -y
    pip freeze | grep -i virtualenv | xargs -r pip uninstall -y
    # Remove any remaining Poetry files
    rm -rf /home/appuser/.poetry /home/appuser/.config/pypoetry /home/appuser/.cache/pypoetry 2>/dev/null || true
fi

# Verify whisper is installed
if ! python -c "import whisper" &> /dev/null; then
    echo "Warning: whisper module is not installed. Installing now..."
    pip install --no-cache-dir openai-whisper==20231117 soundfile
fi

# Verify chromadb is installed
if ! python -c "import chromadb" &> /dev/null; then
    echo "Warning: chromadb module is not installed. Installing now..."
    pip install --no-cache-dir chromadb==0.4.22
fi

# Start the AI service FastAPI app directly without Poetry
exec uvicorn ai_service.main:app --host 0.0.0.0 --port "${PORT:-8000}"
