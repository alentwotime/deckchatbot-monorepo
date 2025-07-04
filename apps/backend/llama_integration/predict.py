# C:\deckbot-ai-backend\llama_integration\predict.py

import base64
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment variables
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8000")

def run_model(image_bytes: bytes, prompt: str = "What shape is this deck?") -> str:
    try:
        # Create a multipart form with the image and prompt
        files = {'file': ('image.jpg', image_bytes)}
        data = {'prompt': prompt}

        # Send request to AI service
        response = requests.post(
            f"{AI_SERVICE_URL}/vision-query",
            files=files,
            data=data,
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("success", False):
                return result.get("response", "No response content")
            else:
                return f"AI Service Error: {result.get('error', 'Unknown error')}"
        else:
            return f"Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Request failed: {e}"
