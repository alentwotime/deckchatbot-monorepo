from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import UnidentifiedImageError
from llava_handler import process_image

app = FastAPI()

@app.get("/")
def root():
    return {"message": "AI microservice is running"}

@app.post("/analyze-image/")
async def analyze_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = process_image(contents)
        return {"result": result}
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file")
    except Exception:
        raise HTTPException(status_code=500, detail="Image processing failed")
