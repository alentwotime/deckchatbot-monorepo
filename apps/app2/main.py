from fastapi import FastAPI, Form, UploadFile, File
import os

app = FastAPI()

# Original “hello world” endpoint
@app.get("/")
async def read_root():
    return {"message": "Hello, World"}

# Example: handle form data + file upload (requires python-multipart)
@app.post("/upload/")
async def upload_file(
    name: str = Form(...),
    file: UploadFile = File(...)
):
    contents = await file.read()
    size = len(contents)
    return {
        "filename": file.filename,
        "field_name": name,
        "size": size
    }