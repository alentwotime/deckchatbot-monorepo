# C:\deckbot-ai-backend\llama_integration\predict.py

import base64
import requests


def run_model(image_bytes: bytes, prompt: str = "What shape is this deck?") -> str:
    # Convert raw image bytes to base64
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llava-deckbot",
            "prompt": prompt,
            "images": [encoded_image],
            "stream": False
        }
    )

    if response.status_code == 200:
        return response.json().get("response", "No response content")
    else:
        return f"Error: {response.status_code} - {response.text}"
