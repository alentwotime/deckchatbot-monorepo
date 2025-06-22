@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://ai-service:11434/process",  # 🔐 Docker internal call
                files={"file": ("image.png", image_bytes, file.content_type)},
                timeout=30.0
            )
        response.raise_for_status()
        return {"result": response.json()["result"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"AI Service error: {str(e)}")
