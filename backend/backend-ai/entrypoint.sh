#!/bin/bash
# entrypoint.sh

exec uvicorn backend_ai.main:app --host 0.0.0.0 --port 8000
