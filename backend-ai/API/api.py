from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from llama_integration.predict import run_model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Deckbot AI backend is alive!"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = run_model(image_bytes)
    return {"result": result}

