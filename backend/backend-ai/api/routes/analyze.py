from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import subprocess
import tempfile
import json
import os

router = APIRouter()

@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Run the deckchatbot model against an uploaded image."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    command = ["ollama", "run", "deckchatbot", "--image", tmp_path]

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        output = result.stdout
        json_start = output.find("{")
        json_end = output.rfind("}") + 1
        parsed = json.loads(output[json_start:json_end])
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "raw_output": output})
    finally:
        os.remove(tmp_path)

    return parsed
