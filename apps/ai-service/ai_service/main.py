import base64
import os
from typing import List, Dict, Any, Optional, Union
from pathlib import Path

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
    # Enhanced AI capabilities
    enhanced_chat_with_context,
    analyze_image_with_enhanced_multimodal,
    process_deck_design_query,
    get_best_model_for_task,
)
from ai_service.image_processing import (
    process_image,
    analyze_image_with_ocr,
    analyze_image_with_ocr_debug,
    enhance_image_with_difix,
)
# Enhanced services from research report recommendations
from ai_service.difix_service import (
    difix_service,
    enhance_deck_3d_preview,
)
from ai_service.vector_db_service import (
    vector_db_service,
    enhance_query_with_context,
)
from ai_service.whisper_service import (
    whisper_service,
    transcribe_voice_command,
    process_voice_interaction,
)
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
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

    # Enhanced startup initialization
    try:
        # Initialize vector database with default knowledge
        await vector_db_service.initialize_default_knowledge()
        print("✓ Vector database initialized with default deck knowledge")

        # Load Whisper model
        await whisper_service.load_model()
        print("✓ Whisper ASR model loaded")

        print("✓ Enhanced AI services initialized successfully")
    except Exception as e:
        print(f"Warning: Some enhanced services failed to initialize: {e}")

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

# Enhanced models for new functionality
class EnhancedChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    task_type: str = "conversation"  # conversation, reasoning, multimodal
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class EnhancedChatResponse(BaseModel):
    response: str
    model_used: str
    enhanced_context: Optional[str] = None

class DifixEnhanceRequest(BaseModel):
    imageBase64: str
    quality_level: str = "high"  # high, medium, fast
    enhancement_type: str = "artifact_removal"

class DifixEnhanceResponse(BaseModel):
    enhanced_image_base64: str
    enhancement_type: str
    processing_time: Optional[float] = None

class VoiceTranscriptionRequest(BaseModel):
    audioBase64: str
    context: Optional[Dict[str, Any]] = None

class VoiceTranscriptionResponse(BaseModel):
    transcribed_text: str
    command_type: str
    confidence: float
    processed_command: Dict[str, Any]

class KnowledgeSearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    n_results: int = 5

class KnowledgeSearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    enhanced_context: str

class BlueprintAnalysisRequest(BaseModel):
    imageBase64: str
    analysis_type: str = "blueprint"  # blueprint, technical, general
    user_id: Optional[str] = None

class BlueprintAnalysisResponse(BaseModel):
    analysis_result: str
    extracted_data: Dict[str, Any]
    similar_blueprints: List[Dict[str, Any]]

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


# --- Enhanced AI Endpoints (Research Report Recommendations) ---

@app.post("/enhanced-chat", response_model=EnhancedChatResponse)
async def enhanced_chat(request: EnhancedChatRequest):
    """
    Enhanced chat with intelligent model selection and context awareness.
    """
    try:
        # Get enhanced context if user_id provided
        enhanced_context = None
        if request.user_id:
            context_data = await enhance_query_with_context(
                request.messages[-1]["content"] if request.messages else "",
                request.user_id
            )
            enhanced_context = context_data["enhanced_context"]

            # Add context to messages
            if enhanced_context:
                context_message = {
                    "role": "system",
                    "content": f"Relevant context: {enhanced_context}"
                }
                request.messages.insert(0, context_message)

        # Use enhanced chat with context
        response = await enhanced_chat_with_context(
            request.messages, 
            request.task_type, 
            request.context or {}
        )

        # Get the model that was used
        model_used = await get_best_model_for_task(request.task_type)

        return {
            "response": response,
            "model_used": model_used,
            "enhanced_context": enhanced_context
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhanced chat error: {str(e)}")


@app.post("/difix-enhance", response_model=DifixEnhanceResponse)
async def difix_enhance_3d(request: DifixEnhanceRequest):
    """
    Enhance 3D deck renderings using NVIDIA Difix model.
    """
    try:
        import time
        start_time = time.time()

        # Decode image
        image_bytes = base64.b64decode(request.imageBase64)

        # Enhance using Difix service
        enhanced_bytes = await enhance_deck_3d_preview(image_bytes, request.quality_level)

        # Encode result
        enhanced_base64 = base64.b64encode(enhanced_bytes).decode("utf-8")

        processing_time = time.time() - start_time

        return {
            "enhanced_image_base64": enhanced_base64,
            "enhancement_type": request.enhancement_type,
            "processing_time": processing_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Difix enhancement error: {str(e)}")


@app.post("/transcribe-voice", response_model=VoiceTranscriptionResponse)
async def transcribe_voice(request: VoiceTranscriptionRequest):
    """
    Transcribe voice commands for deck design workflow.
    """
    try:
        # Decode audio
        audio_bytes = base64.b64decode(request.audioBase64)

        # Process voice interaction
        result = await process_voice_interaction(audio_bytes, request.context)

        return {
            "transcribed_text": result["original_text"],
            "command_type": result["command_type"],
            "confidence": result["confidence"],
            "processed_command": result["processed_command"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice transcription error: {str(e)}")


@app.post("/search-knowledge", response_model=KnowledgeSearchResponse)
async def search_knowledge(request: KnowledgeSearchRequest):
    """
    Search the vector database for relevant deck design knowledge.
    """
    try:
        # Get enhanced context
        context_data = await enhance_query_with_context(request.query, request.user_id)

        return {
            "results": context_data["relevant_knowledge"][:request.n_results],
            "enhanced_context": context_data["enhanced_context"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge search error: {str(e)}")


@app.post("/analyze-blueprint-enhanced", response_model=BlueprintAnalysisResponse)
async def analyze_blueprint_enhanced(request: BlueprintAnalysisRequest):
    """
    Enhanced blueprint analysis with multimodal AI and context storage.
    """
    try:
        # Analyze image with enhanced multimodal
        analysis_result = await analyze_image_with_enhanced_multimodal(
            "Analyze this deck blueprint and extract all relevant information including dimensions, materials, and structural elements.",
            request.imageBase64,
            request.analysis_type
        )

        # Search for similar blueprints
        similar_blueprints = await vector_db_service.search_similar_blueprints(
            analysis_result, n_results=3
        )

        # Store analysis for future reference
        if request.user_id:
            analysis_data = {
                "description": analysis_result,
                "analysis_type": request.analysis_type,
                "user_id": request.user_id,
                "timestamp": str(time.time())
            }
            await vector_db_service.store_blueprint_analysis(analysis_data)

        # Extract structured data (basic parsing)
        extracted_data = {
            "analysis_type": request.analysis_type,
            "has_dimensions": "dimension" in analysis_result.lower() or "feet" in analysis_result.lower(),
            "has_materials": "wood" in analysis_result.lower() or "composite" in analysis_result.lower(),
            "complexity": "high" if len(analysis_result) > 500 else "medium" if len(analysis_result) > 200 else "low"
        }

        return {
            "analysis_result": analysis_result,
            "extracted_data": extracted_data,
            "similar_blueprints": similar_blueprints
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhanced blueprint analysis error: {str(e)}")


@app.post("/deck-design-query")
async def deck_design_query(query: str = Form(...), context: Optional[str] = Form(None)):
    """
    Process deck design queries with reasoning-optimized models.
    """
    try:
        # Parse context if provided
        context_dict = None
        if context:
            import json
            try:
                context_dict = json.loads(context)
            except json.JSONDecodeError:
                context_dict = {"raw_context": context}

        # Process query
        response = await process_deck_design_query(query, context_dict)

        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deck design query error: {str(e)}")


@app.get("/ai-capabilities")
async def get_ai_capabilities():
    """
    Get information about available AI capabilities and models.
    """
    try:
        # Get model information
        whisper_info = await whisper_service.get_model_info()
        difix_available = difix_service.is_available()
        vector_db_stats = vector_db_service.get_collection_stats()

        return {
            "enhanced_models": {
                "conversation": "neural-chat (primary), llama3.1:8b (fallback)",
                "multimodal": "qwen2.5-vl (primary), llava-deckbot (fallback)",
                "reasoning": "phi3:mini (primary), neural-chat (fallback)"
            },
            "voice_capabilities": whisper_info,
            "difix_enhancement": {
                "available": difix_available,
                "enhancement_types": ["artifact_removal", "quality_improvement"],
                "quality_levels": ["high", "medium", "fast"]
            },
            "vector_database": vector_db_stats,
            "features": [
                "Enhanced conversational AI",
                "Multi-modal image analysis",
                "3D rendering enhancement",
                "Voice interaction",
                "Knowledge base search",
                "Context-aware responses"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting AI capabilities: {str(e)}")
