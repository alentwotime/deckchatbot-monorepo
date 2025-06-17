## 🧠 Scope of Work

You are reviewing a monorepo containing:
- A Python FastAPI backend (`backend-ai/`)
- A Node.js frontend application (`frontend/deckchatbot/` — a Git submodule)
- Shared logic for deck estimation and AI chat

Include logic, files, routes, and scripts from *all* folders — including any submodules.

Ignore unrelated system files or directories outside this project.

# 🧠 Codex Prompt for DeckChatbot Monorepo

## 🗂️ Project Structure (Simplified)

```
/deckchatbot-monorepo
├── backend-ai/
│   ├── API/
│   ├── llama_integration/
│   ├── Scripts/
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── deckchatbot/
│   ├── routes/, public/, services/, utils/
│   ├── index.js, server.js
│   ├── package.json
│   └── README.md
├── .vscode/
│   └── settings.json
└── PROMPT.md (this file)
```

---

## 🎯 Goal

Clean up, consolidate, and optimize this monorepo to ensure the frontend and backend are properly integrated.

---

## ✅ What Codex/AI Should Do

### 1. 🧹 Clean and Consolidate Folder Structure

* Detect duplicate or overlapping folders like `/frontend/deckchatbot-monorepo/` or `/frontend/deckchatbot/`.
* Flatten unnecessary nesting (e.g. remove "deckchatbot" inside "deckchatbot").
* Move backend-only files (`*.py`, `poetry.lock`, `pyproject.toml`) into `backend-ai/`.
* Move frontend-only files (`package.json`, `index.js`, etc.) into `frontend/`.

### 2. 🧬 Merge Duplicate Files (Logically)

If a file (e.g., `README.md`, `config.js`, `index.js`) exists in both folders:

* Combine their content without duplicating code.
* Retain critical imports, logic blocks, and API definitions.
* Eliminate commented-out or deprecated code.

### 3. 🔗 Fix Frontend ↔ Backend Integration

* Ensure API calls in `frontend/routes/` properly point to the routes exposed in `backend-ai/API/` or `backend-ai/Scripts/`.
* Update CORS headers or endpoints if mismatched.
* Ensure form submissions, file uploads, or JSON calls from frontend map to real Python endpoints.

### 4. 🚫 Remove Git Submodule Links

* Delete lingering `.git` folders from copied repos (already done).
* Reset Git tracking cleanly from monorepo root.

### 5. 📁 Normalize Naming

* Ensure consistent casing: `Deckchatbot`, `deckchatbot`, and `DeckChatBot` should all resolve to `deckchatbot`.
* Folder names like `API/`, `Scripts/`, and `utils/` should match across frontend and backend if reused.

### 6. 📌 Final Checks

* Ensure monorepo can be opened as a **multi-root workspace** in VS Code.
* Place `.vscode/settings.json` in the root.

---

## 🛠️ When Done, Ensure:

* `npm install are up to date && npm run dev` works in `/frontend`
* `poetry install && python API/server.py` (or similar) works in `/backend-ai`

---

## 📬 Notes for Codex

* Be careful when merging folders with the same name.
* Favor code from backend when merging `.py` files.
* Favor code from frontend `deckchatbot/` when consolidating JavaScript.

You may suggest renaming folders and restructuring if it improves clarity.

---

Thanks! 🚀



# 🧠 Codex Prompt for DeckChatbot Monorepo

You are an AI developer agent responsible for reviewing, optimizing, and enhancing a monorepo-based project called **DeckChatbot**. This project combines a Python backend and a Node.js frontend to support deck building calculations, sketch recognition, and AI-powered chat functionality.

---

## 📦 Project Structure

```
deckchatbot-monorepo/
├── backend-ai/               # FastAPI backend
├── frontend/
│   └── deckchatbot/          # Node.js/Express frontend (Git submodule)
├── PROMPT.md                 # This instruction file
├── README.md                 # Monorepo documentation
```

---

## 🔍 Scope of Review

You must review, clean, and optimize the **entire project**, including submodules.

1. **Do not skip submodules.** Treat `frontend/deckchatbot` as part of the project. Read and interpret all files within it.
2. Traverse all source code inside:
   - `backend-ai/` (Python, FastAPI)
   - `frontend/deckchatbot/` (Node.js, Express, SQLite)
3. Include `.vscode/`, `routes`, `controllers`, and utility folders for full logic coverage.

---

## 🧹 Objectives

- **Clean up unused or redundant files**
- **Merge duplicate scripts or utilities logically**
- **Improve routing, error handling, and data validation**
- **Ensure AI integrations are working and documented**
- **Unify logging, rate-limiting, and security logic**
- **Enhance HTML templates and frontend layout logic**
- **Ensure all APIs (chatbot, calculator, upload) are testable and connected**

---

## 🧠 AI Models & Integration

- `ollama run llava-llama3` is used to run the vision model locally
- OCR and shape recognition logic may exist in both backend and frontend — centralize it if redundant

---

## ✅ Deliverables

- Refactored, cleaned-up repo
- Removed deprecated files or unreferenced modules
- Updated backend + frontend logic
- Documented `.env.example` templates
- Setup instructions via README
- Ensure `git submodule` paths work properly on clone

---

## 🛑 Do Not

- Touch anything outside the `deckchatbot-monorepo/` folder
- Include system directories like `../Downloads` or `../Desktop`
- Skip the submodule folder due to its Git status — treat it as local code


