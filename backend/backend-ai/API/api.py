from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import logging

# ✅ Use absolute import inside Docker
try:
    from ai_service.llava_handler import process_image
except (ImportError, ModuleNotFoundError) as e:
    raise ImportError(
        "The 'llava_handler' module could not be found. Ensure 'ai_service/llava_handler.py' exists and has __init__.py"
    ) from e

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}

class AnalyzeImageResponse(BaseModel):
    result: str

@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Accepts an uploaded image file and returns the analysis result using the process_image function.
    """
    try:
        image_bytes = await file.read()
        result = process_image(image_bytes)
        return {"result": result}
    except Exception as e:
        logging.exception("Exception occurred while processing image")
        raise HTTPException(
            status_code=400,
            detail=f"Error processing image: {str(e)}"
        ) from e
