from PIL import Image, UnidentifiedImageError
import io

def process_image(image_bytes):
    """Process an uploaded image and return a simple description."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except UnidentifiedImageError:
        raise
    width, height = image.size
    return f"Received image of size {width}x{height}"
