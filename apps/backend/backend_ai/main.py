<<<<<<< HEAD:backend/backend-ai/backend_ai/main.py
from fastapi import FastAPI
from api.routes import analyze
=======
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import base64
>>>>>>> 1076c6e (Refactor: Comprehensive project restructuring and service wiring updates):apps/backend/backend_ai/main.py

app = FastAPI()
app.include_router(analyze.router)

@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}


@app.get("/health")
def health():
    """Health check endpoint used by Docker."""
    return {"status": "backend OK"}

<<<<<<< HEAD:backend/backend-ai/backend_ai/main.py
=======
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
                "http://ai-service:8000/process", # Corrected port to 8000
                files={"file": ("image.png", image_bytes, "image/png")}, # Assuming png, could infer from base64 prefix
                timeout=30.0,
            )
        response.raise_for_status()
        return {"result": response.json()["result"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"AI Service error: {str(e)}")
>>>>>>> 1076c6e (Refactor: Comprehensive project restructuring and service wiring updates):apps/backend/backend_ai/main.py
