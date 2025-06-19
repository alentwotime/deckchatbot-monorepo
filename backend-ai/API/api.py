from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llama_integration.predict import run_model
from llama_integration.llava_runner import run_llava

import os
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'deckchatbot.db')


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """CREATE TABLE IF NOT EXISTS upload_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )"""
    )
    conn.commit()
    conn.close()


init_db()


class DeckCalcRequest(BaseModel):
    length: float
    width: float
    boardWidth: float | None = 5.5
    boardLength: float | None = 16
    waste: float | None = 10


@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}


@app.get('/health')
def health():
    return {"status": "healthy"}


@app.post('/predict')
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = run_model(image_bytes)
    return {"result": result}


@app.post('/calculate-deck-materials')
def calculate_deck(req: DeckCalcRequest):
    if req.length <= 0 or req.width <= 0:
        return {"error": "Valid length and width required"}
    deck_area = req.length * req.width
    board_area = (req.boardWidth / 12) * req.boardLength
    boards = int(((deck_area / board_area) * (1 + req.waste / 100)) + 0.999)
    return {
        "deckArea": round(deck_area, 2),
        "boardArea": round(board_area, 2),
        "boards": boards,
    }


@app.post('/upload-image')
async def upload_image(image: UploadFile = File(...)):
    os.makedirs('uploads', exist_ok=True)
    data = await image.read()
    file_path = os.path.join('uploads', image.filename)
    with open(file_path, 'wb') as f:
        f.write(data)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        'INSERT INTO upload_history (file_name, file_type) VALUES (?, ?)',
        (image.filename, image.content_type)
    )
    conn.commit()
    conn.close()
    return {'filename': image.filename, 'size': len(data)}


@app.post('/upload-drawing')
async def upload_drawing(image: UploadFile = File(...)):
    return await upload_image(image)


@app.post('/digitalize-drawing')
async def digitalize_drawing(drawing: UploadFile = File(...)):
    data = await drawing.read()
    return {"message": "Received drawing", "bytes": len(data)}


@app.post('/measurements')
async def measurements(image: UploadFile = File(...)):
    data = await image.read()
    return {"message": "Measurement processing not implemented", "size": len(data)}


@app.post('/chatbot')
def chatbot(message: str = Body(..., embed=True)):
    return {"response": f"Echo: {message}"}


@app.post('/ai/visual-prompt')
async def query_llava(image: UploadFile = File(...), prompt: str = Form(...)):
    data = await image.read()
    result = run_llava(data, prompt)
    return {"response": result}
