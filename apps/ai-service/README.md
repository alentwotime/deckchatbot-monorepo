# AI Service

This is the consolidated AI service for the DeckChatbot application. It provides a unified interface for all AI-related
functionality.

## Architecture

The AI service has been refactored to provide a clear separation of concerns:

### Core Components

1. **`ai_service/core.py`** - Core AI functionality
    - Integration with Ollama for image analysis and chat
    - Configuration management for AI providers
    - Functions: `analyze_image_with_ollama()`, `chat_with_ollama()`

2. **`ai_service/image_processing.py`** - Image processing functionality
    - OCR-based image analysis using pytesseract
    - Dimension parsing and square footage calculation
    - Image enhancement using NVIDIA Difix via Hugging Face
    - Functions: `analyze_image_with_ocr()`, `enhance_image_with_difix()`, `process_image()`

3. **`ai_service/blueprint.py`** - Blueprint generation
    - SVG blueprint generation from analysis data
    - File analysis for deck measurements
    - Functions: `generate_blueprint_svg()`, `analyze_files()`

4. **`ai_service/main.py`** - FastAPI application
    - API endpoints for all AI functionality
    - Request/response models
    - Error handling and validation

### API Endpoints

- `GET /` - Health check endpoint
- `GET /health` - Dedicated health endpoint for Docker
- `POST /analyze-image` - Analyze images using AI or OCR
- `POST /bot-query` - Query the chatbot
- `POST /enhance-image` - Enhance images using NVIDIA Difix
- `POST /full-analyze` - Perform full analysis on uploaded files
- `POST /full-analyze-debug` - Full analysis with debug information
- `POST /analyze-files` - Analyze files to generate deck measurements
- `POST /generate-blueprint` - Generate blueprint SVG from analysis data

## Configuration

The service uses environment variables for configuration:

- `AI_PROVIDER` - AI provider to use (default: "ollama")
- `OLLAMA_MODEL_NAME` - Ollama model name (default: "llava-deckbot")
- `OLLAMA_BASE_URL` - Ollama base URL (default: "http://localhost:11434")
- `HF_API_TOKEN` - Hugging Face API token for image enhancement
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI provider)

## Dependencies

The service depends on:

- FastAPI for the web framework
- httpx for HTTP client functionality
- Pillow (PIL) for image processing
- pytesseract for OCR functionality
- lib2.square_footage for dimension parsing and calculation

## Deployment

The service is containerized using Docker and can be deployed using the provided Dockerfile and entrypoint.sh script.

## Consolidation Notes

This service consolidates functionality that was previously scattered across multiple directories:

- **apps/ai-service** - Main AI service implementation (kept and enhanced)
- **apps/backend/backend_ai** - Backend AI functionality (functionality moved to this service)
- **apps/backend/ai_service** - Empty placeholder (can be removed)
- **apps/backend/backend-ai** - Empty placeholder (can be removed)
- **backend/backend-ai** - Incomplete implementation (can be removed)

The backend service (`apps/backend/backend_ai`) now acts as a proxy to this AI service for most AI functionality, while
this service provides the actual AI capabilities.

## Future Improvements

1. Add OpenAI integration for direct OpenAI API calls
2. Implement more sophisticated image analysis algorithms
3. Add support for additional AI providers
4. Enhance blueprint generation with more detailed SVG output
5. Add caching for frequently requested analyses
