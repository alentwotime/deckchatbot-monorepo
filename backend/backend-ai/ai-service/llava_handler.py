from PIL import Image, UnidentifiedImageError
import io

def process_image(image_bytes):
    """
    Process an uploaded image and return a simple description.

    Args:
        image_bytes (bytes): Raw bytes of the uploaded image.

    Returns:
        str: Description of the image dimensions.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except UnidentifiedImageError:
        raise ValueError("Invalid image file")

    width, height = image.size
    return f"Received image of size {width}x{height}"
