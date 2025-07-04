import ollama
import base64
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get configuration from environment variables
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "llava-deckbot")
PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))

app = FastAPI(title="AI Service API", description="API for AI services")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_response(prompt):
    """
    Generates a text response from the llava-deckbot model.
    """
    try:
        response = ollama.chat(model=OLLAMA_MODEL_NAME, messages=[
            {
                'role': 'user',
                'content': prompt,
            },
        ])
        return response['message']['content']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interacting with Ollama: {e}")

@app.post("/generate")
async def generate_text(prompt: str = Form(...)):
    """
    Generate text response from the AI model.
    """
    try:
        response_content = generate_response(prompt)
        return {"success": True, "response": response_content}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/vision-query")
async def vision_query(file: UploadFile = File(...), prompt: str = Form("Describe this image")):
    """
    Process an image with the LLaVA model and return the response.
    """
    try:
        # Read image bytes
        img_bytes = await file.read()

        # Convert to base64
        encoded_image = base64.b64encode(img_bytes).decode("utf-8")

        # Call Ollama with image
        response = ollama.generate(
            model=OLLAMA_MODEL_NAME,
            prompt=prompt,
            images=[encoded_image],
            stream=False
        )

        return {"success": True, "response": response.get("response", "")}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    try:
        # Check if Ollama is available
        models = ollama.list()
        available_models = [model["name"] for model in models.get("models", [])]

        return {
            "status": "healthy",
            "ollama_available": True,
            "model_name": OLLAMA_MODEL_NAME,
            "available_models": available_models
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    print(f"Starting AI Service on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
