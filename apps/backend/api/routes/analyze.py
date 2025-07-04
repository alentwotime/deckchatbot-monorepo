from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import base64
import requests
import json

router = APIRouter()

@router.post("/vision-query")
async def vision_query(file: UploadFile = File(...), prompt: str = "Describe image"):
    """Send the uploaded image to the local Ollama LLaVA REST API."""
    img_bytes = await file.read()
    data = base64.b64encode(img_bytes).decode()
    try:
        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llava-deckbot", "prompt": prompt, "images": [data]},
        )
        return resp.json()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Backward compatible wrapper around vision_query."""
    return await vision_query(file)
