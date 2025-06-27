import base64
import requests


def run_llava(image_bytes: bytes, prompt: str = "Describe this image") -> str:
    """Send image and prompt to a local Ollama LLaVA server."""
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    try:
        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "alentwotime/llava-deckbot",
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
