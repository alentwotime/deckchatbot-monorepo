#!/usr/bin/env bash
set -e

# Start the AI service FastAPI app
exec poetry run uvicorn ai_service.main:app --host 0.0.0.0 --port "${PORT:-8000}"
