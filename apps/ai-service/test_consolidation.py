"""
Test script to verify that the consolidated AI service works correctly.
"""

import os
import sys

# Add the ai_service directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai_service'))


def test_imports():
    """Test that all modules can be imported successfully."""
    try:
        from ai_service.core import analyze_image_with_ollama, chat_with_ollama
        from ai_service.image_processing import process_image, analyze_image_with_ocr
        from ai_service.blueprint import generate_blueprint_svg, analyze_files, AnalysisResult
        print("✓ All modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False


def test_blueprint_generation():
    """Test blueprint generation functionality."""
    try:
        from ai_service.blueprint import generate_blueprint_svg, AnalysisResult

        # Create test analysis data
        analysis_data = AnalysisResult(
            gross_living_area=500.0,
            net_square_footage=450.0,
            linear_railing_footage=100.0,
            stair_cutouts=2
        )

        # Generate blueprint
        svg_content = generate_blueprint_svg(analysis_data)

        # Verify SVG content
        if "<svg" in svg_content and "Generated Blueprint" in svg_content:
            print("✓ Blueprint generation works correctly")
            return True
        else:
            print("✗ Blueprint generation failed - invalid SVG content")
            return False
    except Exception as e:
        print(f"✗ Blueprint generation error: {e}")
        return False


def test_image_processing():
    """Test image processing functionality."""
    try:
        from ai_service.image_processing import process_image

        # Create a simple test image (1x1 pixel)
        from PIL import Image
        import io

        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()

        # Test image processing
        result = process_image(img_bytes)

        if "100x100" in result:
            print("✓ Image processing works correctly")
            return True
        else:
            print("✗ Image processing failed - unexpected result")
            return False
    except Exception as e:
        print(f"✗ Image processing error: {e}")
        return False


def main():
    """Run all tests."""
    print("Testing consolidated AI service...")
    print("=" * 50)

    tests = [
        test_imports,
        test_blueprint_generation,
        test_image_processing,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")

    if passed == total:
        print("✓ All tests passed! The consolidated AI service is working correctly.")
        return True
    else:
        print("✗ Some tests failed. Please check the implementation.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
