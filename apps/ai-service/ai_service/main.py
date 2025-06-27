import base64
import os
from typing import List, Dict, Any

from ai_service.blueprint import (
    AnalysisResult as BlueprintAnalysisResult,
    generate_blueprint_svg,
    analyze_files,
)
# Import modules from the ai_service package
from ai_service.core import (
    AI_PROVIDER,
    analyze_image_with_ollama,
    chat_with_ollama,
)
from ai_service.image_processing import (
    process_image,
    analyze_image_with_ocr,
    analyze_image_with_ocr_debug,
    enhance_image_with_difix,
)
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

app = FastAPI()

# --- Configuration ---
UPLOAD_DIR = "uploads"
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # No specific API key check here, as Ollama will be handled internally

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
async def health_root():
    """Basic health endpoint for backward compatibility."""
    return {"status": "ai-service OK"}


@app.get("/health")
async def health():
    """Dedicated health endpoint used by Docker."""
    return {"status": "ai-service OK"}

@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(request: ImageAnalysisRequest):
    """
    Analyze an image using AI or OCR.
    """
    try:
        if AI_PROVIDER == "ollama":
            result = await analyze_image_with_ollama(request.prompt, request.imageBase64)
            return {"result": result}
        elif AI_PROVIDER == "openai":
            # This branch would be for direct OpenAI image analysis if this service was to handle it.
            # For this setup, we assume the backend handles OpenAI calls directly.
            raise HTTPException(status_code=501,
                                detail="OpenAI image analysis not directly implemented in ai-service. Backend should handle OpenAI or proxy here if configured.")
        else:
            # Fallback to OCR based analysis for generic images if AI_PROVIDER is not recognized or is for OCR
            image_bytes = base64.b64decode(request.imageBase64)
            analysis = await analyze_image_with_ocr(image_bytes)
            return {
                "result": f"OCR Text: {analysis['ocr_text']}. Parsed Dimensions: {analysis['parsed_dimensions']}"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis error: {str(e)}")

@app.post("/bot-query", response_model=BotQueryResponse)
async def bot_query(request: BotQueryRequest):
    """
    Query the chatbot.
    """
    try:
        if AI_PROVIDER == "ollama":
            response_content = await chat_with_ollama(request.messages, request.options)
            return {"response": response_content}
        elif AI_PROVIDER == "openai":
            # This branch would be for direct OpenAI chat if this service was to handle it.
            # For this setup, we assume the backend handles OpenAI calls directly.
            raise HTTPException(status_code=501,
                                detail="OpenAI chat not directly implemented in ai-service. Backend should handle OpenAI or proxy here if configured.")
        else:
            return {"response": "AI_PROVIDER not configured for chat or an unknown provider is set."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@app.post("/enhance-image", response_model=EnhanceImageResponse)
async def enhance_image(request: EnhanceImageRequest):
    """
    Enhance an image using NVIDIA Difix via Hugging Face.
    """
    try:
        image_bytes = base64.b64decode(request.imageBase64)
        enhanced_bytes = await enhance_image_with_difix(image_bytes, HF_API_TOKEN)
        enhanced_base64 = base64.b64encode(enhanced_bytes).decode("utf-8")
        return {"enhanced_image_base64": enhanced_base64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image enhancement error: {str(e)}")

@app.post("/full-analyze")
async def full_analyze(file: UploadFile = File(...)):
    """
    Perform full analysis on an uploaded file.
    """
    try:
        image_bytes = await file.read()
        analysis = await analyze_image_with_ocr(image_bytes)

        return {
            "filename": file.filename,
            "ocr_text": analysis["ocr_text"],
            "parsed_dimensions": analysis["parsed_dimensions"],
            "square_footage_estimate": analysis["square_footage_estimate"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")

@app.post("/full-analyze-debug")
async def full_analyze_debug(file: UploadFile = File(...)):
    """
    Perform full analysis on an uploaded file and include debug information.
    """
    try:
        image_bytes = await file.read()
        analysis = await analyze_image_with_ocr_debug(image_bytes)

        return {
            "filename": file.filename,
            "ocr_text": analysis["ocr_text"],
            "parsed_dimensions": analysis["parsed_dimensions"],
            "square_footage_estimate": analysis["square_footage_estimate"],
            "image_preview": analysis["image_preview"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")


@app.post("/analyze-files", response_model=AnalysisResult)
async def analyze_files_endpoint(files: List[FileInfo]):
    """
    Analyze files to generate deck measurements.
    """
    try:
        result = analyze_files(files)
        return {
            "gross_living_area": result.gross_living_area,
            "net_square_footage": result.net_square_footage,
            "linear_railing_footage": result.linear_railing_footage,
            "stair_cutouts": result.stair_cutouts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing files: {e}")


@app.post("/generate-blueprint")
async def generate_blueprint(data: AnalysisData):
    """
    Generate a blueprint SVG from analysis data.
    """
    try:
        # Convert AnalysisData to BlueprintAnalysisResult
        analysis_result = BlueprintAnalysisResult(
            gross_living_area=data.analysisData.gross_living_area,
            net_square_footage=data.analysisData.net_square_footage,
            linear_railing_footage=data.analysisData.linear_railing_footage,
            stair_cutouts=data.analysisData.stair_cutouts
        )

        # Generate the blueprint SVG
        svg_content = generate_blueprint_svg(analysis_result)

        return {"svg": svg_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating blueprint: {e}")
