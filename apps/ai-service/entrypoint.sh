#!/usr/bin/env bash
set -e

# Ensure we're using the correct Python path
export PYTHONPATH="/app:${PYTHONPATH}"

# Disable Poetry and virtualenv creation
export POETRY_VIRTUALENVS_CREATE=false
export POETRY_VIRTUALENVS_IN_PROJECT=false
export POETRY_NO_INTERACTION=1
export POETRY_CACHE_DIR="/home/appuser/.cache/pypoetry"
export VIRTUAL_ENV_DISABLE_PROMPT=1
export VIRTUALENV_SYSTEM_SITE_PACKAGES=true
export POETRY_VIRTUALENVS_PATH="/home/appuser/.cache/pypoetry/virtualenvs"
export POETRY_VIRTUALENVS_OPTIONS_ALWAYS_COPY=true
export POETRY_VIRTUALENVS_OPTIONS_NO_PIP=true
export POETRY_VIRTUALENVS_OPTIONS_NO_SETUPTOOLS=true

# Create a dummy virtualenv to prevent Poetry from trying to create one
mkdir -p /home/appuser/.cache/pypoetry/virtualenvs
touch /home/appuser/.cache/pypoetry/virtualenvs/.keep
chmod -R 777 /home/appuser/.cache/pypoetry

# Verify Poetry is not installed and remove it if found
if command -v poetry &> /dev/null; then
    echo "Warning: Poetry is still installed. Removing it now..."
    pip uninstall -y poetry poetry-core poetry-plugin-export virtualenv 2>/dev/null || true
    pip freeze | grep -i poetry | xargs -r pip uninstall -y
    pip freeze | grep -i virtualenv | xargs -r pip uninstall -y
fi

# Ensure pypoetry directories exist and have proper permissions
mkdir -p /home/appuser/.cache/pypoetry/virtualenvs
chmod -R 777 /home/appuser/.cache/pypoetry

# Verify whisper is installed
if ! python -c "import whisper" &> /dev/null; then
    echo "Warning: whisper module is not installed. Installing now..."
    pip install --no-cache-dir openai-whisper==20231117
fi

# Start the AI service FastAPI app directly without Poetry
exec uvicorn ai_service.main:app --host 0.0.0.0 --port "${PORT:-8000}"
