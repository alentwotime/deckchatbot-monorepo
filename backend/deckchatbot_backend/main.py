import os
import uuid
import sqlite3
import json
from typing import AsyncGenerator

import pytesseract
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from PIL import Image
from azure.storage.blob import BlobServiceClient
import openai
import redis
from dotenv import load_dotenv

load_dotenv()

AZURE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

openai.api_key = OPENAI_API_KEY
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) if AZURE_CONNECTION_STRING else None
redis_client = redis.from_url(REDIS_URL)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://alensdeckbot.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "chat.db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.execute(
    "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, message TEXT)"
)
conn.commit()

class ChatRequest(BaseModel):
    message: str
    session_id: str

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    with open(temp_filename, "wb") as f:
        f.write(contents)
    text = pytesseract.image_to_string(Image.open(temp_filename))
    blob_url = None
    if blob_service_client:
        container = blob_service_client.get_container_client("uploads")
        try:
            container.create_container()
        except Exception:
            pass
        blob_client = container.get_blob_client(temp_filename)
        with open(temp_filename, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        blob_url = blob_client.url
    return {"filename": temp_filename, "ocr_text": text, "blob_url": blob_url}

async def stream_chat(prompt: str, session_id: str) -> AsyncGenerator[str, None]:
    history_key = f"history:{session_id}"
    history = redis_client.get(history_key)
    messages = json.loads(history) if history else []
    messages.append({"role": "user", "content": prompt})
    redis_client.set(history_key, json.dumps(messages))
    conn.execute("INSERT INTO messages(session_id, message) VALUES (?, ?)", (session_id, prompt))
    conn.commit()
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        stream=True,
    )
    async def generate():
        collected = ""
        for chunk in response:
            part = chunk.choices[0].delta.get("content", "")
            collected += part
            yield part
        messages.append({"role": "assistant", "content": collected})
        redis_client.set(history_key, json.dumps(messages))
    return generate()

@app.post("/chat")
async def chat(req: ChatRequest):
    generator = await stream_chat(req.message, req.session_id)
    return StreamingResponse(generator, media_type="text/plain")

