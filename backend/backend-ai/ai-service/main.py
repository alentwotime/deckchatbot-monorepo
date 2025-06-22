from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI()

@app.get("/")
def root():
    return {"message": "AI service is running."}

@app.post("/process")
async def process_image(file: UploadFile = File(...)):
    contents = await file.read()
    # TODO: Add LLaVA/Ollama logic here
    return {"result": "AI processed image successfully"}
