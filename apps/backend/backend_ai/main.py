from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import base64
import os
import uuid

# Hugging Face Diffix token
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

app = FastAPI()

# --- Configuration ---
UPLOAD_DIR = "uploads"
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")  # Default to openai
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "llava-deckbot")

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # The AI_PROVIDER check for OPENAI_API_KEY will now happen in ai-service startup if needed.
    # Backend doesn't need OPENAI_API_KEY unless it's making direct calls.
    # We'll make backend always proxy to ai-service for image analysis if AI_PROVIDER is ollama
    # or if AI_PROVIDER is openai and ai-service is configured as an OpenAI proxy.
    pass

# --- Models ---
class ImageAnalysisRequest(BaseModel):
    imageBase64: str
    prompt: str = "Analyze this image"

class AnalyzeImageResponse(BaseModel):
    result: str

class EnhanceImageRequest(BaseModel):
    imageBase64: str

class EnhanceImageResponse(BaseModel):
    enhanced_image_base64: str

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
    """Forward image analysis requests to the AI service."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://deckchatbot-ai-service:8000/analyze-image", # Use service name for inter-service communication
                json=request.dict(),
                timeout=300.0, # Increased timeout for potential large models
            )
        response.raise_for_status()
        return {"result": response.json()["result"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Service proxy error: {str(e)}")


@app.post("/full-analyze")
async def full_analyze(file: UploadFile = File(...)):
    """Proxy file upload to the AI service's full analysis endpoint."""
    try:
        contents = await file.read()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://deckchatbot-ai-service:8000/full-analyze", # Use service name for inter-service communication
                files={"file": (file.filename, contents, file.content_type)},
                timeout=300.0, # Increased timeout
            )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Service error: {str(e)}")


@app.post("/enhance-image", response_model=EnhanceImageResponse)
async def enhance_image(request: EnhanceImageRequest):
    """Use NVIDIA Difix via Hugging Face to clean rendering artifacts."""
    if not HF_API_TOKEN:
        raise HTTPException(status_code=500, detail="HF_API_TOKEN not configured")
    try:
        img_bytes = base64.b64decode(request.imageBase64)
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api-inference.huggingface.co/models/NVIDIA/difix",
                headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
                content=img_bytes,
                timeout=60.0,
            )
        resp.raise_for_status()
        b64 = base64.b64encode(resp.content).decode("utf-8")
        return {"enhanced_image_base64": b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HuggingFace error: {str(e)}")

@app.post("/bot-query", response_model=BotQueryResponse)
async def bot_query(request: BotQueryRequest):
    if AI_PROVIDER == "ollama":
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://deckchatbot-ai-service:8000/bot-query", # New endpoint for chat in ai-service
                    json=request.dict(),
                    timeout=300.0,
                )
            response.raise_for_status()
            return {"response": response.json()["response"]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Service chat error: {str(e)}")
    else:
        # Fallback for other AI_PROVIDERs (e.g., if you still want a mocked response for OpenAI)
        return {"response": "This is a mocked response, configure AI_PROVIDER for live chat."}

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
