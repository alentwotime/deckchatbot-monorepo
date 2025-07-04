"""
Image Processing Module

This module provides image processing functionality for the DeckChatbot application,
including OCR, dimension parsing, and square footage calculation.
"""

import base64
import io

from PIL import Image, UnidentifiedImageError
from lib2.square_footage import (
    extract_text_from_image,
    parse_dimensions_from_text,
    calculate_square_footage,
)


def process_image(image_bytes):
    """
    Process an uploaded image and return a simple description.

    Args:
        image_bytes (bytes): Raw bytes of the uploaded image.

    Returns:
        str: Description of the image dimensions.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except UnidentifiedImageError:
        raise ValueError("Invalid image file")

    width, height = image.size
    return f"Received image of size {width}x{height}"


async def analyze_image_with_ocr(image_bytes):
    """
    Analyze an image using OCR.
    
    Args:
        image_bytes (bytes): The image bytes.
        
    Returns:
        dict: The analysis result containing OCR text, parsed dimensions, and square footage.
    """
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
        "ocr_text": text,
        "parsed_dimensions": dims,
        "square_footage_estimate": sqft
    }


async def analyze_image_with_ocr_debug(image_bytes):
    """
    Analyze an image using OCR and include a base64 preview.
    
    Args:
        image_bytes (bytes): The image bytes.
        
    Returns:
        dict: The analysis result containing OCR text, parsed dimensions, square footage, and image preview.
    """
    result = await analyze_image_with_ocr(image_bytes)

    # Add base64 image preview
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    image_url = f"data:image/jpeg;base64,{image_base64}"
    result["image_preview"] = image_url

    return result


async def enhance_image_with_difix(image_bytes, hf_api_token):
    """
    Enhance an image using NVIDIA Difix via Hugging Face.
    
    Args:
        image_bytes (bytes): The image bytes.
        hf_api_token (str): The Hugging Face API token.
        
    Returns:
        bytes: The enhanced image bytes.
    """
    import httpx

    if not hf_api_token:
        raise ValueError("HF_API_TOKEN not configured")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api-inference.huggingface.co/models/NVIDIA/difix",
                headers={"Authorization": f"Bearer {hf_api_token}"},
                content=image_bytes,
                timeout=60.0,
            )
        resp.raise_for_status()
        return resp.content
    except Exception as e:
        raise Exception(f"HuggingFace error: {str(e)}")
