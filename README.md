# AlensDeckBot Monorepo

This repository contains the frontend React application, FastAPI backend, and supporting AI service for the AlensDeckBot project.

## Running locally

1. Install Node.js and Python 3.11.
2. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```
3. Build and start services with Docker Compose:
   ```bash
   docker compose up --build
   ```

## Repository structure

- `frontend/` – Node.js Express API with a React frontend
- `frontend/src/` – the actual React application served on Render
- `backend/backend-ai/` – FastAPI service
- `backend/backend-ai/ai-service/` – secondary AI service

See `frontend/README.md` for application details.

## Deployment

The production website at [alensdeckbot.onrender.com](https://alensdeckbot.onrender.com)
is built from the code in `frontend/src`. Changes to that directory will be
reflected on the main site after deployment.
