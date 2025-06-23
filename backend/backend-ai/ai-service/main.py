from fastapi import FastAPI, UploadFile, File

app = FastAPI()


@app.get("/")
def root():
    return {"message": "AI service is running."}


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    # TODO: Add LLaVA/Ollama logic here
    return {"result": "AI processed image successfully"}
