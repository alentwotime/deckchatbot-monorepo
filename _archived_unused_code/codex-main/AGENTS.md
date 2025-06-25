# agents.md

## Agent Access Policy

This repository permits full access to automation agents (e.g., GitHub Copilot Workspace, Codex CLI agents, AI dev tools) under the following permissions and constraints:

---

## ✅ Permissions Granted

### 1. **Code Read/Write Access**
- ✅ Full access to **read**, **modify**, and **rewrite** **move** **remove** **adjust** any file in:
  - `frontend/`
  - `backend/backend-ai/`
  - `backend/backend-ai/ai_service/`
  - `deckchatbot-monorepo/`
  - `libs/`, `utils/`, or other helper directories

### 2. **File/Folder Structure**
- ✅ Agents are permitted to:
  - Move, rename, or delete files and folders
  - Organize modules into reusable packages or libraries
  - Flatten or modularize nested folders

### 3. **Environment & Config Files**
- ✅ Agents can modify:
  - `.env` and `.env.example`
  - `Dockerfile`, `docker-compose.yml`
  - `.render.yaml`, `.gitignore`, `.dockerignore`

### 4. **Dependency Management**
- ✅ Agents may:
  - Add/remove dependencies in `package.json`, `pyproject.toml`, or `requirements.txt`
  - Modify lockfiles (`yarn.lock`, `poetry.lock`) as needed
  - Run package manager commands like `npm install`, `poetry add`, etc.

### 5. **Testing**
- ✅ Agents are authorized to:
  - Run all tests across all services
  - Add, refactor, or delete test files
  - Install test-related dependencies (e.g. Jest, Pytest)

---

## 🚫 Limits & Warnings

While agents have full access, actions must still:
- Respect language and framework conventions
- Preserve critical build/deployment logic
- Avoid deleting `.git/`, CI/CD workflows, or credential files

---

## ✅ Preferred Structure

Agents should align with the following layout:

deckchatbot-monorepo/
│
├── frontend/ # React frontend
├── backend/
│ └── backend-ai/ # FastAPI backend
│ └── ai_service/ # AI OCR microservice
├── libs/ # Shared Python libs
├── docker-compose.yml
├── .render.yaml # One per service if needed
└── .env, .env.example

yaml
Copy
Edit

---

## 🧠 Codex and CI Agents

This repo is ready for:
- Codex CLI workflows
- Render auto-deploy hooks
- GitHub Copilot Workspace AI editing
- Local or remote agents

Agents may operate recursively or across services unless told otherwise.