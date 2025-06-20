#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="."
FRONTEND_DIR="frontend"

if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  echo "Please run this script from the repository root." >&2
  exit 1
fi

command -v python >/dev/null 2>&1 || { echo "python is not installed." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is not installed." >&2; exit 1; }

trap 'echo "\nStopping servers..."; kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null' SIGINT SIGTERM

echo "Starting FastAPI backend..."
(
  cd "$BACKEND_DIR"
  uvicorn app:app --reload
) &
BACKEND_PID=$!

echo "Starting frontend..."
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

wait $BACKEND_PID
wait $FRONTEND_PID

