from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import base64
import os
import uuid

app = FastAPI()

# --- Configuration ---
UPLOAD_DIR = "uploads"
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")  # Default to openai
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    if AI_PROVIDER == "openai" and not OPENAI_API_KEY:
        raise ValueError("AI_PROVIDER is 'openai', but OPENAI_API_KEY is not set.")

# --- Models ---
class ImageAnalysisRequest(BaseModel):
    imageBase64: str
    prompt: str = "Analyze this image"

class AnalyzeImageResponse(BaseModel):
    result: str

class BotQueryRequest(BaseModel):
    messages: List[Dict[str, Any]]
    options: Dict[str, Any] = {}

class BotQueryResponse(BaseModel):
    response: str

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

# --- Endpoints ---
@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}

@app.get("/health")
def health():
    return {"status": "backend OK"}

@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(request: ImageAnalysisRequest):
    if AI_PROVIDER == "ollama":
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://host.docker.internal:11434/api/generate",
                    json={"model": "llava", "prompt": request.prompt, "images": [request.imageBase64]},
                    timeout=60.0,
                )
            response.raise_for_status()
            return {"result": response.json().get("response", "")}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    elif AI_PROVIDER == "openai":
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
            raise HTTPException(status_code=500, detail=f"AI Service error: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Invalid AI_PROVIDER specified")

@app.post("/bot-query", response_model=BotQueryResponse)
async def bot_query(request: BotQueryRequest):
    if AI_PROVIDER == "openai":
        # In a real application, you would forward this to the ai-service or directly to OpenAI
        return {"response": "This is a mocked OpenAI response."}
    else:
        # Or to a local model via Ollama
        return {"response": "This is a mocked local response."}

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
    return {
        "gross_living_area": 500.0,
        "net_square_footage": 450.0,
        "linear_railing_footage": 100.0,
        "stair_cutouts": 2,
    }

@app.post("/generate-blueprint")
async def generate_blueprint(data: AnalysisData):
    svg_content = f"""
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="lightgrey" />
      <text x="50" y="50" font-family="Arial" font-size="20" fill="black">Generated Blueprint</text>
      <text x="50" y="80" font-family="Arial" font-size="16" fill="black">Gross Living Area: {data.analysisData.gross_living_area} sq ft</text>
      <text x="50" y="110" font-family="Arial" font-size="16" fill="black">Net Square Footage: {data.analysisData.net_square_footage} sq ft</text>
      <text x="50" y="140" font-family="Arial" font-size="16" fill="black">Linear Railing Footage: {data.analysisData.linear_railing_footage} ft</text>
      <text x="50" y="170" font-family="Arial" font-size="16" fill="black">Stair Cutouts: {data.analysisData.stair_cutouts}</text>
    </svg>
    """
    return {"svg": svg_content}
