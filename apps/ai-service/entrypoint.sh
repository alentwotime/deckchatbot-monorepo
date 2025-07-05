#!/usr/bin/env bash
set -e

# Ensure we're using the correct Python path
export PYTHONPATH="/app:${PYTHONPATH}"

# Start the AI service FastAPI app directly without Poetry
exec uvicorn ai_service.main:app --host 0.0.0.0 --port "${PORT:-8000}"
