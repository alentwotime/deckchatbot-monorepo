#!/bin/bash
# entrypoint.sh

exec uvicorn ai_service.main:app --host 0.0.0.0 --port 8000
