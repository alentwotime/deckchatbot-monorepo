# Chatbot Greeting

The assistant starts by asking the user what type of deck job they need (new deck, resurfacing, etc.)

1. Upload Phase
Users upload:

Photos of deck/home area

Blueprint or sketch drawings with measurements and directional markers

1. Image Naming Guide
Use clear file names to help the AI:

Include terms like deck, sketch, layout, or measurements (12x16ft)

Use .png or .jpg

Avoid spaces, emojis, or generic names

Example filenames:

deck-sketch_L-shape_22x16ft.jpg

## User Journey Overview

deck-blueprint_marked-door-stairs.png

4. Image + Drawing Analysis
AI backend uses OCR and vision models to:

Extract deck outline and dimensions

Identify features like doors, stairs, and elevation

Normalize sketches to scale

5. 2D Deck Generation
Creates a clean, digital 2D deck layout from the sketch.

6. Bot Follow-Up
Chatbot asks any missing questions, like deck height or preferred materials.

7. 3D Visualization
Generates a 3D deck model overlayed on the house photo for client presentation.

📸 DeckChatbot Vision Input Guide
Required Uploads
Graph Paper Sketch (Mandatory):

Drawn to scale with all outer measurements labeled

Mark stairs, doors, deck height clearly

Photos of Area (Optional but Recommended):

Back of house or current deck condition

Taken from slight angle for 3D effect

Format & Size
Type Format Max Size
Drawings JPG, PNG, PDF 15MB
Real Photos JPG, PNG 15MB

Tips for Best Results
Use natural daylight, avoid shadows

Ensure graph paper edges visible and flat

Use dark ink or pencil, avoid faint markers

🚀 Getting Started
Prerequisites
Node.js 18+

Python 3.10+

Poetry package manager

Frontend Setup
bash
Copy
cd frontend
npm install
npm run dev
Backend AI Setup
bash
Copy
cd apps/app1
poetry install --no-root
poetry run uvicorn API.api:app --reload
Quick Local Run
From repo root:

bash
Copy
./run.sh
Docker Compose
Build and run all services locally:

bash
Copy
docker compose up --build
Access:

Frontend → <http://localhost:3000>

Backend → <http://localhost:8000>


🐳 Dockerfile and Docker Compose Explained
Backend Dockerfile (Dockerfile)
```Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
EXPOSE ${PORT}
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "${PORT}"]
```
Explanation:

Uses slim Python image for smaller size

Installs Poetry to manage Python dependencies

Copies app code into container

Exposes port 8000 where FastAPI runs

Runs Uvicorn to serve the backend

Frontend Dockerfile (frontend/Dockerfile)
Dockerfile
Copy
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
Explanation:

Uses lightweight Node.js 18 image

Installs npm dependencies

Copies frontend source code

Runs development server on port 3000

Docker Compose (docker-compose.yml)
yaml
Copy
version: "3.9"

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
Explanation:

Defines two services: backend and frontend

Builds each from their respective Dockerfiles

Maps local ports 8000 and 3000 to container ports

Passes environment variables (e.g., OPENAI_API_KEY) to backend

🔑 Environment Variable Management Tips

1. Local Development
Create .env files in root or in each service folder

Add sensitive keys like OPENAI_API_KEY=your_key_here

Use tools like dotenv in Node.js or python-dotenv in Python to load .env

2. Docker Environment Variables
Pass .env values to Docker Compose using env_file or environment sections

Example in docker-compose.yml:

yaml
Copy
services:
  backend:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
Then run export OPENAI_API_KEY=your_key before starting containers

They become available to your app’s runtime environment just like .env

👨‍💻 Built By
AlenTwoTime
GitHub: @alentwotime

📄 License
MIT License
