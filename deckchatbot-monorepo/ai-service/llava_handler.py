from PIL import Image
import io

def process_image(image_bytes):
    # Placeholder logic – this is where LLaVA or OCR will go
    image = Image.open(io.BytesIO(image_bytes))
    width, height = image.size
    return f"Received image of size {width}x{height}"
