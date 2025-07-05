#!/usr/bin/env bash
set -e

# Ensure we're using the correct Python path
export PYTHONPATH="/app:${PYTHONPATH}"

# Disable Poetry and virtualenv creation
export POETRY_VIRTUALENVS_CREATE=false
export POETRY_VIRTUALENVS_IN_PROJECT=false
export POETRY_NO_INTERACTION=1
export VIRTUAL_ENV_DISABLE_PROMPT=1

# Verify Poetry is not installed
if command -v poetry &> /dev/null; then
    echo "Warning: Poetry is still installed. This may cause issues."
fi

# Start the AI service FastAPI app directly without Poetry
exec uvicorn ai_service.main:app --host 0.0.0.0 --port "${PORT:-8000}"
