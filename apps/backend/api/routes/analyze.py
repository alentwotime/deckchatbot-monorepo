from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment variables
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8000")

router = APIRouter()

@router.post("/vision-query")
async def vision_query(file: UploadFile = File(...), prompt: str = "Describe image"):
    """Send the uploaded image to the AI service."""
    try:
        img_bytes = await file.read()

        # Create a multipart form with the image and prompt
        files = {'file': (file.filename, img_bytes, file.content_type)}
        data = {'prompt': prompt}

        # Send request to AI service
        resp = requests.post(
            f"{AI_SERVICE_URL}/vision-query",
            files=files,
            data=data,
            timeout=60
        )

        if resp.status_code == 200:
            return resp.json()
        else:
            return JSONResponse(
                status_code=resp.status_code, 
                content={"error": f"AI service returned: {resp.text}"}
            )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Backward compatible wrapper around vision_query."""
    return await vision_query(file)
