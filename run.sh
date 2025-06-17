#!/usr/bin/env bash
set -euo pipefail

if [ ! -d "backend-ai" ] || [ ! -d "frontend" ]; then
  echo "Please run this script from the repository root." >&2
  exit 1
fi

command -v poetry >/dev/null 2>&1 || { echo "poetry is not installed." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is not installed." >&2; exit 1; }

trap 'echo "\nStopping servers..."; kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null' SIGINT SIGTERM

echo "Starting FastAPI backend..."
(
  cd backend-ai
  poetry run uvicorn API.api:app --reload
) &
BACKEND_PID=$!

echo "Starting frontend..."
(
  cd frontend
  npm run dev
) &
FRONTEND_PID=$!

wait $BACKEND_PID
wait $FRONTEND_PID

