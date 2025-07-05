#!/usr/bin/env bash
set -e

# Ensure we're using the correct Python path
export PYTHONPATH="/app:${PYTHONPATH}"

# Disable Poetry and virtualenv creation
export POETRY_VIRTUALENVS_CREATE=false
export POETRY_VIRTUALENVS_IN_PROJECT=false
export POETRY_NO_INTERACTION=1
export POETRY_CACHE_DIR="/dev/null"
export VIRTUAL_ENV_DISABLE_PROMPT=1
export VIRTUALENV_SYSTEM_SITE_PACKAGES=true

# Verify Poetry is not installed
if command -v poetry &> /dev/null; then
    echo "Warning: Poetry is still installed. This may cause issues."
    pip uninstall -y poetry poetry-core poetry-plugin-export virtualenv 2>/dev/null || true
fi

# Verify whisper is installed
if ! python -c "import whisper" &> /dev/null; then
    echo "Warning: whisper module is not installed. Installing now..."
    pip install --no-cache-dir openai-whisper==20231117
fi

# Start the AI service FastAPI app directly without Poetry
exec uvicorn ai_service.main:app --host 0.0.0.0 --port "${PORT:-8000}"
