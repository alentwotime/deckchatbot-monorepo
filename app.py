import os
from fastapi import FastAPI, Request
import httpx

app = FastAPI()

# Configurable backend bot service URL: set BACKEND_BOT_URL env variable or use default
BACKEND_BOT_URL = os.getenv("BACKEND_BOT_URL", "http://localhost:8000")

@app.get("/")
async def root():
    return {"message": "Welcome to the bot orchestrator API"}

from fastapi.responses import JSONResponse
from fastapi import status
@app.post("/bot-query")
async def bot_query(request: Request):
    """
    Receives a POST request with JSON payload, forwards it to the backend bot service,
    and returns the backend's response.

    Returns:
        JSON response from the backend bot service or an error message if the payload is invalid.
    """
    try:
        data = await request.json()
        data = await request.json()
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "Invalid JSON payload."}
        )
    # Forward the request data to the backend bot service
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BACKEND_BOT_URL}/bot-endpoint", json=data)
    return response.json()

# You can add more routes here to handle other bots or frontend integration
