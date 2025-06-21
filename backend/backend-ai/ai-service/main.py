import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}

class AnalyzeImageResponse(BaseModel):
    result: str

@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        response = requests.post(
            "http://ai-service:11434/process",
            files={"file": ("image.jpg", image_bytes, file.content_type)}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
