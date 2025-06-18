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
