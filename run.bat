@echo off
if not exist backend-ai\ goto notroot
if not exist frontend\ goto notroot

start "backend" cmd /k "cd backend-ai && poetry run uvicorn API.api:app --reload"
start "frontend" cmd /k "cd frontend && npm run dev"

goto :eof
:notroot
echo Please run this script from the repository root.
exit /b 1

