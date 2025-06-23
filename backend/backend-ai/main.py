import os
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Use specific frontend domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8000")

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

async def forward_to_ai_service(file: UploadFile, route: str):
    try:
        contents = await file.read()
        headers = {"Content-Type": file.content_type}

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}{route}",
                content=contents,
                headers=headers,
            )

        response.raise_for_status()
        return JSONResponse(status_code=response.status_code, content=response.json())

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"AI service unavailable: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
