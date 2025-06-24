from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import sys

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

app = FastAPI()

@app.get("/")
async def health_root():
    """Basic health endpoint for backward compatibility."""
    return {"status": "ai-service OK"}


@app.get("/health")
async def health():
    """Dedicated health endpoint used by Docker."""
    return {"status": "ai-service OK"}

@app.post("/analyze-image")
async def analyze(file: UploadFile = File(...)):
    image_bytes = await file.read()
    text = extract_text_from_image(image_bytes)
    dims = parse_dimensions_from_text(text)
    return {
        "text": text,
        "dimensions": dims
    }

@app.post("/full-analyze")
async def full_analyze(file: UploadFile = File(...)):
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
