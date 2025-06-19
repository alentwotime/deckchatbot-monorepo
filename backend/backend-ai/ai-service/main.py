from fastapi import FastAPI, UploadFile, File
from llava_handler import process_image

app = FastAPI()

@app.get("/")
def root():
    return {"message": "AI microservice is running"}

@app.post("/analyze-image/")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    result = process_image(contents)
    return {"result": result}
