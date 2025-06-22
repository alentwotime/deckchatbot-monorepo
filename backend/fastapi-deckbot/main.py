from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow frontend hosted on Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://alensdeckbot.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class AnalyzeImageResponse(BaseModel):
    status: str
    filename: str

@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    print(f"Received {file.filename} with {len(contents)} bytes")
    return AnalyzeImageResponse(status="received", filename=file.filename)

@app.post("/chat", response_model=ChatResponse)
async def chat(data: ChatRequest):
    print(f"Chat message: {data.message}")
    return ChatResponse(reply="Thanks for your message!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
