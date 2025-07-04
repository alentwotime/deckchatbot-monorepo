import base64
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment variables
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLAVA_MODEL_NAME = os.getenv("LLAVA_MODEL_NAME", "llava-deckbot")

def run_llava(image_bytes: bytes, prompt: str = "Describe this image") -> str:
    """Send image and prompt to a local Ollama LLaVA server."""
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLAVA_MODEL_NAME,
                "prompt": prompt,
                "images": [encoded],
                "stream": False,
            },
            timeout=60,
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("response", "").strip()
        return f"Error {resp.status_code}: {resp.text}"
    except Exception as e:
        return f"Request failed: {e}"
