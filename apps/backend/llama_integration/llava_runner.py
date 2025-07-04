import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment variables
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8000")

def run_llava(image_bytes: bytes, prompt: str = "Describe this image") -> str:
    """Send image and prompt to the AI service."""
    try:
        # Create a multipart form with the image and prompt
        files = {'file': ('image.jpg', image_bytes)}
        data = {'prompt': prompt}

        # Send request to AI service
        resp = requests.post(
            f"{AI_SERVICE_URL}/vision-query",
            files=files,
            data=data,
            timeout=60,
        )

        if resp.status_code == 200:
            result = resp.json()
            if result.get("success", False):
                return result.get("response", "").strip()
            else:
                return f"AI Service Error: {result.get('error', 'Unknown error')}"
        return f"Error {resp.status_code}: {resp.text}"
    except Exception as e:
        return f"Request failed: {e}"
