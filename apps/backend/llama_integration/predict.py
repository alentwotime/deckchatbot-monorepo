# C:\deckbot-ai-backend\llama_integration\predict.py

import base64
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment variables
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLAVA_MODEL_NAME = os.getenv("LLAVA_MODEL_NAME", "llava-deckbot")

def run_model(image_bytes: bytes, prompt: str = "What shape is this deck?") -> str:
    # Convert raw image bytes to base64
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": LLAVA_MODEL_NAME,
            "prompt": prompt,
            "images": [encoded_image],
            "stream": False
        }
    )

    if response.status_code == 200:
        return response.json().get("response", "No response content")
    else:
        return f"Error: {response.status_code} - {response.text}"
