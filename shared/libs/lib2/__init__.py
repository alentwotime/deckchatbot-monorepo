from .square_footage import get_square_footage

__all__ = ["get_square_footage", "my_helper"]

def my_helper(x: int) -> int:
    """Sample helper that doubles the input."""
    return x * 2
