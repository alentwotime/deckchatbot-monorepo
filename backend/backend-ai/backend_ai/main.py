import os
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8000")
VISION_SERVICE_URL = os.getenv("VISION_SERVICE_URL", "http://localhost:11434")

@app.get("/")
def root():
    return {"message": "Deckbot AI proxy is alive."}

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    return await forward_to_ai_service(file, "/analyze-image")

@app.post("/full-analyze")
async def full_analyze_image(file: UploadFile = File(...)):
    return await forward_to_ai_service(file, "/full-analyze")

@app.post("/full-analyze-debug")
async def full_analyze_debug(file: UploadFile = File(...)):
    return await forward_to_ai_service(file, "/full-analyze-debug")

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

@app.post("/chat")
async def chat_handler(req: ChatRequest):
    async def chat_stream():
        yield f"You said: {req.message}"
    return StreamingResponse(chat_stream(), media_type="text/plain")

@app.post("/vision/analyze")
async def vision_analyze(file: UploadFile = File(...), prompt: str = "Describe this image"):
    try:
        contents = await file.read()
        files = {"image": (file.filename, contents, file.content_type)}
        data = {"model": "llava-llama3", "prompt": prompt}

        async with httpx.AsyncClient() as client:
            response = await client.post(f"{VISION_SERVICE_URL}/api/generate", data=data, files=files)

        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Vision model error: {e}")

async def forward_to_ai_service(file: UploadFile, route: str):
    try:
        contents = await file.read()
        headers = {"Content-Type": file.content_type}

        async with httpx.AsyncClient() as client:
            response = await client.post(f"{AI_SERVICE_URL}{route}", content=contents, headers=headers)

        response.raise_for_status()
        return JSONResponse(status_code=response.status_code, content=response.json())

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"AI service unavailable: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
