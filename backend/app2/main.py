import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Add CORS middleware here
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://alensdeckbot.onrender.com"],  # or ["*"] during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_SERVICE_URL = "https://deckbot-ai-service.onrender.com/analyze-image"

@app.post("/analyze-image")
async def proxy_to_ai_service(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        headers = {"Content-Type": file.content_type}

        async with httpx.AsyncClient() as client:
            response = await client.post(
                AI_SERVICE_URL,
                content=contents,
                headers=headers,
            )
        
        response.raise_for_status()
        return JSONResponse(status_code=response.status_code, content=response.json())

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"AI service request failed: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"AI service returned error: {e}")
