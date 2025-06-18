# 📐 DeckChatbot Monorepo

An AI-powered assistant to help salespeople analyze, measure, and visualize decks based on field drawings and customer-provided images. This tool guides users through a friendly step-by-step process that starts with chat and ends with a 3D render.

---

## 🧠 Project Scope

DeckChatbot is built to assist with:

- 🖼️ Analyzing blueprint/drawing photos of decks
- 📏 Extracting measurements (in feet and inches)
- 🧮 Calculating square footage
- 🧊 Generating 2D deck layouts from field sketches
- 🏡 Rendering 3D deck visuals placed over actual house images

---

## 🧰 Monorepo Structure

deckchatbot-monorepo/
├── apps/
│ ├── frontend/ # Chat UI, image upload, drawing canvas, 3D viewer
│ └── backend/ # AI model integration, image parsing, deck logic
└── shared/ # Shared utils, models, or constants (optional)

yaml
Copy
Edit

---

## 💬 User Journey

1. **Chatbot Greeting**  
   The deck assistant introduces itself and asks for the type of job (e.g., resurface, new deck).

2. **Upload Phase**  
   User uploads:
   - Photos of the deck area or home
   - Blueprint drawing with exact measurements
   - Sketch with direction markers (stairs, door, elevation arrows)

3. **Image + Drawing Analysis**  
   The backend uses AI (OCR + Vision) to:
   - Extract outline dimensions
   - Identify doors, stairs, and elevation
   - Normalize the layout to scale

4. **2D Deck Generation**  
   A clean, digital 2D drawing is created from the sketch.

5. **Bot Follow-Up**  
   Chatbot asks any missing questions (e.g., deck height, material choice).

6. **3D Visualization**  
   Final output is a 3D deck image **pasted over the house photo** for visual presentation.

## 🚀 Getting Started

### Frontend Setup

```bash
cd apps/frontend
npm install
npm run dev
Requires Node.js & modern browser

Backend Setup
bash
Copy
Edit
cd apps/backend
pip install -r requirements.txt
uvicorn main:app --reload
Requires Python 3.10+ with FastAPI

🔭 Future Features
 AI-assisted sketch correction

 Auto-detect stair orientation from arrows

 Multiple deck shapes (L, octagon, etc.)

 Photo background blending for 3D renders

👨‍💻 Built By
AlenTwoTime
GitHub: @alentwotime

📄 License
MIT License

yaml
Copy
Edit














