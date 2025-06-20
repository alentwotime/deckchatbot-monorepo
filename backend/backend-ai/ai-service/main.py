from fastapi import FastAPI, UploadFile, File, HTTPException
from llava_handler import process_image

app = FastAPI()

@app.get("/")
def root():
    return {"message": "AI service is running"}

@app.post("/process")
async def process(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = process_image(contents)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
