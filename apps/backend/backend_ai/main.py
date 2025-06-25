from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import base64

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}


@app.get("/health")
def health():
    """Health check endpoint used by Docker."""
    return {"status": "backend OK"}

class ImageAnalysisRequest(BaseModel):
    imageBase64: str
    prompt: str = "Analyze this image"

class AnalyzeImageResponse(BaseModel):
    result: str

@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(request: ImageAnalysisRequest):
    try:
        image_bytes = base64.b64decode(request.imageBase64)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://ai-service:8000/process",
                files={"file": ("image.png", image_bytes, "image/png")},
                timeout=30.0,
            )
        response.raise_for_status()
        return {"result": response.json()["result"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"AI Service error: {str(e)}")
