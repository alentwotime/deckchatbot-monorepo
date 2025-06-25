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
   Docker Compose creates a custom `decknet` network with the subnet
   `192.168.65.0/24`. Ensure this range does not conflict with existing
   networks on your machine or adjust the subnet in `docker-compose.yml`.

See `docs/docker_healthcheck.md` for troubleshooting container health checks and log inspection tips.

### Windows line ending fix
If Docker fails with `/usr/bin/env: bash\r`, ensure shell scripts use LF line endings. Configure Git on Windows:
```bash
 git config --global core.autocrlf input
```
This prevents CRLF errors when running containers.


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

## Local library path fix

The backend and AI service both depend on the shared `lib2` package found in
`backend/backend-ai/libs/lib2`. When building Docker images make sure this directory is included in
the build context. The provided Dockerfiles copy it explicitly:

```Dockerfile
COPY backend/backend-ai/libs/lib2 libs/lib2
```

If you see `ModuleNotFoundError: No module named 'lib2.lib2'` during a Docker
build, verify that the `COPY` line above exists and that your build context is
the repository root so the `libs` folder is available.
