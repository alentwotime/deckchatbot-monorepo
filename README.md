# Project Restructuring and Service Wiring Updates

This document summarizes the significant structural changes and service wiring updates applied to the monorepo to improve organization and ensure correct inter-service communication.

## Running locally

1. Install Node.js and Python 3.11.
2. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```
3. Build and start services with Docker Compose:
   ```bash
   docker compose -f docker/docker-compose.yml up --build
   ```
   Docker Compose creates a custom `decknet` network with the subnet
   `192.168.65.0/24`. Ensure this range does not conflict with existing
   networks on your machine or adjust the subnet in `docker-compose.yml`.

## I. Project Structure Reorganization

The monorepo has been reorganized into a more modular and logical structure:

```
.
├── apps/                 # Contains individual applications (frontend, backend, ai-service)
│   ├── frontend/         # React/Node.js frontend application
│   ├── backend/          # Primary FastAPI backend service
│   └── ai-service/       # Dedicated AI-specific service
├── config/               # Project-level configuration files (e.g., eslint, jest, package.json)
├── docker/               # Centralized Docker-related files (e.g., docker-compose.yml)
├── docs/                 # Project documentation
├── scripts/              # General utility and automation scripts
├── shared/               # Reusable code, libraries, and schemas shared across applications
│   └── libs/lib2/        # Shared Python library
├── tests/                # Monorepo-level test files
├── .idx/                 # IDX-specific configurations
├── .vscode/              # VSCode editor configurations
└── _archived_unused_code/ # Archive for old, unused, or deprecated code
```

**Key Changes:**

*   **Application Separation**: `frontend`, `backend`, and `ai-service` are now distinct applications under the `apps/` directory.
*   **Centralized Configurations**: Common configuration files are consolidated in `config/`.
*   **Unified Docker Setup**: `docker-compose.yml` is moved to `docker/` for easier management.
*   **Shared Components**: `libs/lib2` and other utilities are placed in `shared/` to promote reusability and avoid duplication.
*   **Dedicated Archive**: A clear `_archived_unused_code/` directory has been created to store legacy or irrelevant code, keeping the main codebase clean.

## II. Service Wiring Updates

The communication pathways between the `frontend`, `backend`, and `ai-service` have been reviewed and updated to ensure correct routing and adherence to a microservices pattern.

**Specific Updates:**

1.  **`docker/docker-compose.yml`**: Updated `build contexts` and `dockerfile` paths to reflect the new locations of `apps/frontend`, `apps/backend`, and `apps/ai-service`.

2.  **`apps/backend/Dockerfile`**: Modified `COPY` commands to correctly reference the shared `libs/lib2` from the `shared/` directory. The `CMD` instruction was updated to run `backend_ai.main:app`, ensuring the primary backend application is started.

3.  **`apps/backend/entrypoint.sh`**: Adjusted to execute `backend_ai.main:app` using `uvicorn` and `poetry`.

4.  **`apps/ai-service/Dockerfile`**: Updated `COPY` commands to correctly reference its own `pyproject.toml`, `poetry.lock`, and the shared `libs/lib2` from the `shared/` directory. The `CMD` instruction remained focused on running the AI service itself.

5.  **`apps/frontend/controllers/chatbotController.js`**: Changed to import `backend.service.js` and now routes chat requests to the backend service, preventing direct calls to external AI APIs from the frontend.

6.  **`apps/frontend/controllers/drawingUploadController.js`**: Reworked to encode uploaded images to Base64 and send them to the backend's `/analyze-image` endpoint via `backend.service.js`. The responsibility of saving images and storing metadata has been shifted to the backend.

7.  **`apps/frontend/services/openai.service.js`**: This file has been removed as all OpenAI API interactions are now proxied through the `backend` service.

8.  **`apps/backend/backend_ai/main.py`**: The `/analyze-image` endpoint was updated to expect Base64 encoded images from the frontend and to correctly forward them to the `ai-service` for processing, ensuring proper data flow for image analysis.

These changes collectively establish a clearer, more maintainable, and correctly wired microservices architecture for the Deckchatbot Monorepo.
