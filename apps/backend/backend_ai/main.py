from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import List
import httpx
import base64
import os
import uuid

app = FastAPI()

UPLOAD_DIR = "uploads"

@app.on_event("startup")
async def startup_event():
    os.makedirs(UPLOAD_DIR, exist_ok=True)

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

class FileInfo(BaseModel):
    filename: str
    type: str

class AnalysisResult(BaseModel):
    gross_living_area: float
    net_square_footage: float
    linear_railing_footage: float
    stair_cutouts: int

class AnalysisData(BaseModel):
    analysisData: AnalysisResult

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

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...), type: str = Form(...)):
    try:
        filename = f"{uuid.uuid4()}-{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        return {"filename": filename, "type": type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload error: {str(e)}")

@app.post("/analyze-files", response_model=AnalysisResult)
async def analyze_files(files: List[FileInfo]):
    # This is a mock implementation. In a real application, you would
    # use the files to perform the analysis.
    return {
        "gross_living_area": 500.0,
        "net_square_footage": 450.0,
        "linear_railing_footage": 100.0,
        "stair_cutouts": 2,
    }

@app.post("/generate-blueprint")
async def generate_blueprint(data: AnalysisData):
    # This is a mock implementation. In a real application, you would
    # use a library like potrace or a custom algorithm to generate the SVG.
    svg_content = f"""
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="lightgrey" />
      <text x="50" y="50" font-family="Arial" font-size="20" fill="black">
        Generated Blueprint
      </text>
      <text x="50" y="80" font-family="Arial" font-size="16" fill="black">
        Gross Living Area: {data.analysisData.gross_living_area} sq ft
      </text>
      <text x="50" y="110" font-family="Arial" font-size="16" fill="black">
        Net Square Footage: {data.analysisData.net_square_footage} sq ft
      </text>
      <text x="50" y="140" font-family="Arial" font-size="16" fill="black">
        Linear Railing Footage: {data.analysisData.linear_railing_footage} ft
      </text>
      <text x="50" y="170" font-family="Arial" font-size="16" fill="black">
        Stair Cutouts: {data.analysisData.stair_cutouts}
      </text>
    </svg>
    """
    return {"svg": svg_content}
