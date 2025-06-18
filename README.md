# DeckChatbot Monorepo 🛠️🤖

Welcome to the **DeckChatbot Monorepo** — a full-stack AI-powered assistant designed to streamline the quoting, sketching, and logic validation process for deck construction projects.

---
 codex/clean-up-project-and-verify-routing

## 🧠 Scope of Work

You are reviewing a monorepo containing:
- A Python FastAPI backend (`backend-ai/`)
- A Node.js frontend application (`frontend/deckchatbot/` — a Git submodule)
- Shared logic for deck estimation and AI chat

Include logic, files, routes, and scripts from *all* folders — including any submodules.

Ignore unrelated system files or directories outside this project.
 main

## 📦 Project Structure

```
 codex/clean-up-project-and-verify-routing
.

deckchatbot-monorepo/
 main
├── frontend/        # React or HTML-based UI for user interaction
├── backend-ai/      # FastAPI / Python backend with AI integrations
├── .vscode/         # IDE settings and extensions
├── PROMPT.md        # Instruction file for project-wide automation and cleanup
├── README.md        # You're here!
```



## 🎯 Core Features
 codex/clean-up-project-and-verify-routing

You are coding an interactive 3D deck visualization in a React/Three.js app. Using react-three-fiber, implement a DeckScene component that:
- Creates a Three.js scene with a PerspectiveCamera and OrbitControls.
- Generates a deck floor by extruding a user-defined polygonal outline (use Three.js Shape and ExtrudeGeometry).
- Adds separate meshes for deck posts, beams, and railings based on input dimensions.
- Applies materials/textures to surfaces based on user selection.
- Enables clicking on any deck surface to select and highlight it (using raycasting), then displays editable parameters (length, height, etc.).
- Includes a drag/transform control so the user can move selected vertices or objects and automatically rebuilds the deck geometry.
- Calculates deck area and board lengths and shows them in a side panel.
- Provides buttons to export the deck as a 2D blueprint PDF and as a 3D glTF model.
For a high-level design, see [Real-Time 3D Deck Design Blueprint](docs/REALTIME_3D_DECK_DESIGN_BLUEPRINT.md).

Write React/JavaScript code snippets (using react-three-fiber and standard Three.js classes) illustrating how to set up the scene, create and update the extruded floor geometry, handle mouse interaction for selecting and dragging parts, and generate a PDF with deck dimensions. 
 main

- **Dynamic Deck Shape Builder**: L-shape, octagon, and custom sketch input.
- **Image Upload with AI Recognition**: OCR + vision model analysis.
- **Skirting & Material Calculations**: Supports Composite, PVC, and Mineral Board.
- **Ollama Integration**: Running LLaVA-Llama3 model for image + text queries.
- **Drag & Drop Support**: Upload drawings or images directly to calculate.

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/deckchatbot-monorepo.git
cd deckchatbot-monorepo
 codex/clean-up-project-and-verify-routing


# create a .env with your keys
echo "OPENAI_API_KEY=your-key" > .env
echo "DEBUG=true" >> .env
 main
```

### 2. Start the Backend

```bash
cd backend-ai
 codex/clean-up-project-and-verify-routing
poetry install
uvicorn API.api:app --reload

# (Activate your environment or install requirements)
poetry install
poetry run uvicorn API.api:app --reload
 main
```

### 3. Launch the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

 codex/clean-up-project-and-verify-routing
The frontend will use `PYTHON_API_URL` (default `http://localhost:8000`) to
forward image requests to the FastAPI service.

### 4. One-Command Start

If everything is installed, you can run both servers with a single command:

```bash
./run.sh
```

This script launches the FastAPI backend (`poetry run uvicorn API.api:app --reload`) and the frontend (`npm run dev`) and waits on both processes.

Then open `http://localhost:3000/deck-viewer.html` in your browser to try the new 3D deck viewer built with Babylon.js. Use the toolbar to render a deck and export blueprint screenshots or a GLB model.
 main



## 🧠 AI Integration

We use [Ollama](https://ollama.com/library/llava-llama3) to run LLaVA-Llama3 locally.

```bash
ollama run llava-llama3
```

- HuggingFace support through `xtuner` (model loaders / pipelines)



## 🗂 Prompt-based Automation

See `PROMPT.md` for full instructions on:

- Cleanup automation
- Logical merging of duplicate files
- Enhancing layout logic, routing, and data flow

---

## 📌 TODO (Contributions Welcome!)

- [ ] Auto-detect and suggest corrections for invalid deck sketches
- [ ] Export deck plans to PDF
- [ ] Add user accounts + login

---

## ⚖️ License

MIT License. Feel free to fork and expand.
