from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS setup so backend or frontend can call this AI service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Replace with specific domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI service is running."}


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()

    # 🧠 Placeholder — LLaVA / Ollama logic will go here
    # You could save the file, run a model, or parse text

    return {
        "result": "AI processed image successfully",
        "filename": file.filename,
        "size_bytes": len(contents)
    }


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@app.post("/chat")
async def chat_handler(req: ChatRequest):
    """Simple echo-style chat endpoint."""

    async def chat_stream():
        yield f"You said: {req.message}"

    return StreamingResponse(chat_stream(), media_type="text/plain")
