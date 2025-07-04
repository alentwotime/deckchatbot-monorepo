import pytesseract
from PIL import Image
import io
import re

def extract_text_from_image(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(image)

def parse_dimensions_from_text(text: str) -> dict:
    """Parse dimension strings like '12ft x 16ft'."""
    pattern = r"(\d+)[\'ft]*\s*[xX×]\s*(\d+)[\'ft]*"
    match = re.search(pattern, text)
    if match:
        return {"width_ft": int(match.group(1)), "length_ft": int(match.group(2))}
    return {"width_ft": None, "length_ft": None}


def calculate_square_footage(length_ft: float, width_ft: float) -> float:
    """Simple area calculation."""
    return length_ft * width_ft


def get_square_footage(length_ft: float, width_ft: float) -> float:
    """Backward compatible wrapper for calculate_square_footage."""
    return calculate_square_footage(length_ft, width_ft)
