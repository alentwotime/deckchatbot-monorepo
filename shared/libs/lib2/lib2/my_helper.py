from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Allow monorepo path so lib2 can be imported cleanly
sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
)

# 🔁 Import from lib2.square_footage
from lib2.square_footage import (
    extract_text_from_image,
    parse_dimensions_from_text,
    calculate_square_footage
)

app = FastAPI()

# ✅ Enable CORS for frontend/backend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI service is running."}

@app.get("/test-helper")
def test_helper():
    length = 12
    width = 10
    sqft = calculate_square_footage(length, width)
    return {
        "length_ft": length,
        "width_ft": width,
        "square_footage": sqft
    }

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        text = extract_text_from_image(contents)
        dims = parse_dimensions_from_text(text)
        return {
            "filename": file.filename,
            "text": text,
            "dimensions": dims
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

@app.post("/chat")
async def chat_handler(req: ChatRequest):
    async def chat_stream():
        yield f"You said: {req.message}"

    return StreamingResponse(chat_stream(), media_type="text/plain")
