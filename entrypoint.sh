#!/usr/bin/env bash
set -e

# Launch the FastAPI orchestrator
exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}

