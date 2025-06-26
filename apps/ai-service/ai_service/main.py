from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import sys
import httpx # Import httpx for making HTTP requests
import json # Import json for parsing Ollama streaming response

# Ensure local lib2 package can be imported when running outside Docker
# sys.path.append(
#     os.path.abspath(
#         os.path.join(os.path.dirname(__file__), "../../../..", "libs")
#     )
# )
from lib2.square_footage import (
    extract_text_from_image,
    parse_dimensions_from_text,
    calculate_square_footage,
)
import base64
from pydantic import BaseModel # Import BaseModel for request validation
from typing import List, Dict, Any

app = FastAPI()

# --- Configuration ---
UPLOAD_DIR = "uploads"
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")  # Default to ollama in this service
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "llava-deckbot")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") # Updated to localhost as Ollama is embedded

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
    result: str # This should be the structure of the response from Ollama or OCR

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
    if AI_PROVIDER == "ollama":
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL_NAME,
                        "prompt": request.prompt,
                        "images": [request.imageBase64]
                    },
                    timeout=300.0, # Increased timeout for potential large models
                )
                response.raise_for_status()
                # Ollama's /api/generate returns a stream of JSON objects, we need to parse them
                full_response = ""
                for line in response.iter_lines():
                    if line:
                        try:
                            json_data = json.loads(line)
                            if "response" in json_data:
                                full_response += json_data["response"]
                        except json.JSONDecodeError:
                            continue # Skip lines that are not valid JSON
                return {"result": full_response}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ollama image analysis error: {str(e)}")
    elif AI_PROVIDER == "openai":
        # This branch would be for direct OpenAI image analysis if this service was to handle it.
        # For this setup, we assume the backend handles OpenAI calls directly.
        raise HTTPException(status_code=501, detail="OpenAI image analysis not directly implemented in ai-service. Backend should handle OpenAI or proxy here if configured.")
    else:
        # Fallback to OCR based analysis for generic images if AI_PROVIDER is not recognized or is for OCR
        image_bytes = base64.b64decode(request.imageBase64)
        text = extract_text_from_image(image_bytes)
        dims = parse_dimensions_from_text(text)
        return {
            "result": f"OCR Text: {text}. Parsed Dimensions: {dims}" # Return a combined result for now
        }

@app.post("/bot-query", response_model=BotQueryResponse)
async def bot_query(request: BotQueryRequest):
    if AI_PROVIDER == "ollama":
        try:
            async with httpx.AsyncClient() as client:
                # Ollama chat endpoint structure
                ollama_messages = [
                    {"role": msg["role"], "content": msg["content"]} 
                    for msg in request.messages
                ]
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL_NAME,
                        "messages": ollama_messages,
                        "options": request.options # Pass along any options
                    },
                    timeout=300.0,
                )
            response.raise_for_status()
            # Ollama /api/chat also returns a stream of JSON objects
            full_response_content = ""
            for line in response.iter_lines():
                if line:
                    try:
                        json_data = json.loads(line)
                        if "message" in json_data and "content" in json_data["message"]:
                            full_response_content += json_data["message"]["content"]
                    except json.JSONDecodeError:
                        continue
            return {"response": full_response_content}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ollama chat error: {str(e)}")
    elif AI_PROVIDER == "openai":
        # This branch would be for direct OpenAI chat if this service was to handle it.
        # For this setup, we assume the backend handles OpenAI calls directly.
        raise HTTPException(status_code=501, detail="OpenAI chat not directly implemented in ai-service. Backend should handle OpenAI or proxy here if configured.")
    else:
        return {"response": "AI_PROVIDER not configured for chat or an unknown provider is set."}

@app.post("/full-analyze")
async def full_analyze(file: UploadFile = File(...)):
    # This endpoint currently uses local OCR and dimension parsing. Keep as is.
    try:
        image_bytes = await file.read()

        # Step 1: OCR
        text = extract_text_from_image(image_bytes)

        # Step 2: Parse dimensions
        dims = parse_dimensions_from_text(text)
        dim_list = dims.get("dimensions", [])

        # Step 3: Compute sqft if at least two 'ft' values
        ft_values = [d["value"] for d in dim_list if d["unit"] == "ft"]
        sqft = None
        if len(ft_values) >= 2:
            sqft = calculate_square_footage(ft_values[0], ft_values[1])

        return {
            "filename": file.filename,
            "ocr_text": text,
            "parsed_dimensions": dims,
            "square_footage_estimate": sqft
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")

@app.post("/full-analyze-debug")
async def full_analyze_debug(file: UploadFile = File(...)):
    # This endpoint also uses local OCR. Keep as is.
    try:
        image_bytes = await file.read()

        # Step 1: OCR
        text = extract_text_from_image(image_bytes)

        # Step 2: Parse dimensions
        dims = parse_dimensions_from_text(text)
        dim_list = dims.get("dimensions", [])

        # Step 3: Compute sqft if at least two 'ft' values
        ft_values = [d["value"] for d in dim_list if d["unit"] == "ft"]
        sqft = None
        if len(ft_values) >= 2:
            sqft = calculate_square_footage(ft_values[0], ft_values[1])

        # Step 4: Base64 image preview
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:image/jpeg;base64,{image_base64}"

        return {
            "filename": file.filename,
            "ocr_text": text,
            "parsed_dimensions": dims,
            "square_footage_estimate": sqft,
            "image_preview": image_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")
