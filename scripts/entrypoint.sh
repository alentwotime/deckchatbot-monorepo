#!/usr/bin/env bash
set -e

# Launch the FastAPI AI service using Poetry
exec poetry run uvicorn ai_service.main:app --host 0.0.0.0 --port ${PORT:-8000}
