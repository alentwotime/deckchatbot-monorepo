# 🧠 DeckChatbot Monorepo

An AI-powered assistant to help salespeople analyze, measure, and visualize decks based on field drawings and customer-provided images. This tool guides users through a friendly step-by-step process that starts with chat and ends with a 3D render.

---

📁 Monorepo Structure

💬 User Journey

**Chatbot Greeting**
The deck assistant introduces itself and asks for the type of job (e.g., resurface, new deck).

**Upload Phase**
User uploads:

* Photos of the deck area or home
* Blueprint drawing with exact measurements
* Sketch with direction markers (stairs, door, elevation arrows)

📂 Image Naming Guide

To help the AI properly process your images, use clear filenames when uploading:

**Use this format:**

deck-sketch_graph-measurements_12x16ft.png

**Tips:**

* ✅ Include terms like `deck`, `sketch`, `layout`, or `measurements`
* ✅ Add size if known (e.g., `12x16ft`)
* ✅ Use `.png` or `.jpg`
* ❌ Avoid spaces, emojis, or generic names like `image1.png`

**Examples:**

* `deck-sketch_L-shape_22x16ft.jpg`
* `deck-blueprint_marked-door-stairs.png`

**Image + Drawing Analysis**
The backend uses AI (OCR + Vision) to:

* Extract outline dimensions
* Identify doors, stairs, and elevation
* Normalize the layout to scale

**2D Deck Generation**
A clean, digital 2D drawing is created from the sketch.

**Bot Follow-Up**
Chatbot asks any missing questions (e.g., deck height, material choice).

**3D Visualization**
Final output is a 3D deck image **pasted over the house photo** for visual presentation.

![Sample layout](layout.png)

---

## 📸 DeckChatbot Vision Input Guide

To ensure accurate AI measurement and rendering, please follow these guidelines when uploading drawings or photos.

### 1️⃣ Required Uploads

#### ✅ A. Graph Paper Sketch (Mandatory)

* Drawn **to scale** using graph paper
* All **outer measurements** labeled (in feet and inches)
* **Mark** the following clearly:

* **Stairs** → arrow labeled "stairs"
* **House Door** → box or line labeled "door"
* **Deck Height** → upward arrow with height (e.g., 3' 6")

#### 🔧 Example Markup

* 12' 3" x 14' 6"
* ↕️ 3' 6" (deck height)
* ↗️ (stairs)
* 📦 (door)

#### ✅ B. Real Photos of Area (Optional but Recommended)

* Photo of the **back of the house** (where the deck is going)
* Any current deck condition (if resurfacing)
* Photos should:

* Show the full **area or wall**
* Be taken from a slight angle (for 3D overlay realism)
* Avoid obstructions (cars, people, dogs, etc.)

### 2️⃣ Formats

| Type        | Format           | Max Size |
| ----------- | ---------------- | -------- |
| Drawings    | .JPG, .PNG, .PDF | 15MB     |
| Real Photos | .JPG, .PNG       | 15MB     |

### 3️⃣ Tips for Accuracy

* Use natural daylight (avoid harsh shadows)
* Ensure graph paper edges are **fully visible**
* Avoid folds or tilted angles when photographing sketches
* Use black ink or dark pencil — no neon or faint markers

### 🧠 AI Process

1. **OCR** reads measurement labels
2. **Edge detection** outlines perimeter
3. **Classification** identifies features (stairs, doors, height)
4. **2D to 3D model conversion**
5. **Image overlay** (your photo + 3D render)

---

## 🚀 Getting Started

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend/backend-ai
poetry install --no-root
poetry run uvicorn API.api:app --reload
```

> Requires Node.js 18+ and Python 3.10+

### Quick Local Run

From the repository root:

```bash
./run.sh
```

### Docker Quick Start

Build and run both services with Docker Compose:

```bash
docker compose up --build
```

The frontend will be available at [http://localhost:3000](http://localhost:3000) and the backend at [http://localhost:8000](http://localhost:8000).

### Deploying to Azure

Use your own container registry and web app. Example commands:

```bash
# Build and push images
az acr build --registry <ACR_NAME> --image deckchatbot-backend:latest -f backend/backend-ai/Dockerfile ./backend/backend-ai
az acr build --registry <ACR_NAME> --image deckchatbot-frontend:latest -f frontend/Dockerfile ./frontend

# Deploy containers (App Service or Container Apps)
az webapp create --name deckchatbot-backend --resource-group <RG> --plan <PLAN> --deployment-container-image-name <ACR_NAME>.azurecr.io/deckchatbot-backend:latest
az webapp create --name deckchatbot-frontend --resource-group <RG> --plan <PLAN> --deployment-container-image-name <ACR_NAME>.azurecr.io/deckchatbot-frontend:latest
```

## 🔭 Future Features

* [ ] AI-assisted sketch correction
* [ ] Auto-detect stair orientation from arrows
* [ ] Multiple deck shapes (L, octagon, etc.)
* [ ] Photo background blending for 3D renders


## 👨‍💻 Built By

**AlenTwoTime**
GitHub: [@alentwotime](https://github.com/alentwotime)

## 📄 License

MIT License
