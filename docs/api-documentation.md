# DeckChatbot API Documentation

This document provides comprehensive documentation for all API endpoints in the DeckChatbot monorepo, including request/response examples, authentication requirements, and error handling information.

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Error Handling](#error-handling)
4. [Backend Service API](#backend-service-api)
5. [AI Service API](#ai-service-api)
6. [Backend Python API](#backend-python-api)
7. [Rate Limiting](#rate-limiting)
8. [Environment Configuration](#environment-configuration)

## Overview

The DeckChatbot system consists of multiple API services:

- **Backend Service** (Node.js/Express) - Main backend API running on port 3001
- **AI Service** (Python/FastAPI) - AI and machine learning endpoints
- **Backend Python API** (FastAPI) - Additional Python-based API endpoints

## Authentication & Authorization

### Current State
The APIs are currently designed for **internal service communication** and do not implement explicit authentication mechanisms. All endpoints are accessible without authentication tokens.

### Security Considerations
- APIs are intended for use within the internal network
- External access should be controlled at the infrastructure level (firewall, VPN, etc.)
- Future implementation should consider adding API keys or JWT tokens for external access

### User Identification
Some endpoints accept optional `user_id` parameters for tracking and personalization:
- Used for analytics and user-specific context
- Not used for authorization/access control
- Stored in database for audit trails

## Error Handling

### Standard Error Response Format

#### FastAPI Services (AI Service, Backend Python API)
```json
{
  "detail": "Error description"
}
```

#### Express Services (Backend Service)
```json
{
  "success": false,
  "error": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error
- `501` - Not Implemented (feature not available)

## Backend Service API

**Base URL:** `http://localhost:3001`

### Health Check Endpoints

#### Get Database Test
```http
GET /db-test
```

Tests database connectivity.

**Response:**
```json
{
  "success": true,
  "time": "2025-01-27T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

### General Endpoints

#### Hello Endpoint
```http
GET /api/hello
```

Simple health check endpoint.

**Response:**
```json
{
  "message": "Hello from DeckChatbot Backend!"
}
```

### Vision Analysis

#### Analyze Image with Vision Model
```http
POST /vision/analyze
Content-Type: multipart/form-data
```

Analyzes uploaded images using LLaVA vision model.

**Request:**
- `image` (file): Image file to analyze
- `prompt` (string, optional): Analysis prompt (default: "What is shown in this deck sketch? Identify measurements, stairs, and door.")

**Response:**
```json
{
  "success": true,
  "result": {
    "model": "alentwotime/llava-deckbot",
    "response": "Analysis result text..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Vision model failed"
}
```

**Rate Limiting:** 100 requests per 15 minutes

## AI Service API

**Base URL:** `http://localhost:8000` (typical FastAPI port)

### Health Check

#### Service Health
```http
GET /
```

```http
GET /health
```

**Response:**
```json
{
  "status": "ai-service OK"
}
```

### Image Analysis

#### Analyze Image
```http
POST /analyze-image
Content-Type: application/json
```

**Request:**
```json
{
  "imageBase64": "base64-encoded-image-data",
  "prompt": "Analyze this image"
}
```

**Response:**
```json
{
  "result": "Analysis result text"
}
```

#### Full Image Analysis
```http
POST /full-analyze
Content-Type: multipart/form-data
```

**Request:**
- `file` (file): Image file to analyze

**Response:**
```json
{
  "filename": "image.jpg",
  "ocr_text": "Extracted text from image",
  "parsed_dimensions": {
    "width": 10.5,
    "height": 8.0
  },
  "square_footage_estimate": 84.0
}
```

#### Full Image Analysis with Debug
```http
POST /full-analyze-debug
Content-Type: multipart/form-data
```

**Request:**
- `file` (file): Image file to analyze

**Response:**
```json
{
  "filename": "image.jpg",
  "ocr_text": "Extracted text from image",
  "parsed_dimensions": {
    "width": 10.5,
    "height": 8.0
  },
  "square_footage_estimate": 84.0,
  "image_preview": "base64-encoded-processed-image"
}
```

### Image Enhancement

#### Enhance Image
```http
POST /enhance-image
Content-Type: application/json
```

**Request:**
```json
{
  "imageBase64": "base64-encoded-image-data"
}
```

**Response:**
```json
{
  "enhanced_image_base64": "base64-encoded-enhanced-image"
}
```

#### Enhanced Image Processing with Difix
```http
POST /difix-enhance-3d
Content-Type: application/json
```

**Request:**
```json
{
  "imageBase64": "base64-encoded-image-data",
  "quality_level": "high",
  "enhancement_type": "artifact_removal"
}
```

**Response:**
```json
{
  "enhanced_image_base64": "base64-encoded-enhanced-image",
  "enhancement_type": "artifact_removal",
  "processing_time": 2.5
}
```

### Chatbot

#### Bot Query
```http
POST /bot-query
Content-Type: application/json
```

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the best materials for deck construction?"
    }
  ],
  "options": {}
}
```

**Response:**
```json
{
  "response": "For deck construction, the best materials include..."
}
```

#### Enhanced Chat
```http
POST /enhanced-chat
Content-Type: application/json
```

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Help me design a deck"
    }
  ],
  "task_type": "conversation",
  "user_id": "user123",
  "context": {
    "previous_designs": [],
    "preferences": {}
  }
}
```

**Response:**
```json
{
  "response": "I'd be happy to help you design a deck...",
  "model_used": "alentwotime/llava-deckbot",
  "enhanced_context": "Additional context information"
}
```

#### Deck Design Query
```http
POST /deck-design-query
Content-Type: application/x-www-form-urlencoded
```

**Request:**
- `query` (string): Design query
- `context` (string, optional): Additional context

**Response:**
```json
{
  "response": "Design recommendations...",
  "model_used": "alentwotime/llava-deckbot",
  "enhanced_context": "Context-aware suggestions"
}
```

### File Analysis

#### Analyze Files
```http
POST /analyze-files
Content-Type: application/json
```

**Request:**
```json
{
  "files": [
    {
      "filename": "blueprint.pdf",
      "type": "pdf"
    }
  ]
}
```

**Response:**
```json
{
  "gross_living_area": 500.0,
  "net_square_footage": 450.0,
  "linear_railing_footage": 100.0,
  "stair_cutouts": 2
}
```

#### Generate Blueprint
```http
POST /generate-blueprint
Content-Type: application/json
```

**Request:**
```json
{
  "analysisData": {
    "gross_living_area": 500.0,
    "net_square_footage": 450.0,
    "linear_railing_footage": 100.0,
    "stair_cutouts": 2
  }
}
```

**Response:**
```json
{
  "svg_content": "<svg>...</svg>"
}
```

### Voice Processing

#### Transcribe Voice
```http
POST /transcribe-voice
Content-Type: application/json
```

**Request:**
```json
{
  "audioBase64": "base64-encoded-audio-data",
  "context": {
    "user_id": "user123"
  }
}
```

**Response:**
```json
{
  "transcribed_text": "I want to build a deck",
  "command_type": "design_request",
  "confidence": 0.95,
  "processed_command": {
    "action": "design",
    "subject": "deck"
  }
}
```

### Knowledge Search

#### Search Knowledge Base
```http
POST /search-knowledge
Content-Type: application/json
```

**Request:**
```json
{
  "query": "deck building codes",
  "user_id": "user123",
  "n_results": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "title": "Building Codes for Decks",
      "content": "Deck building codes require...",
      "relevance_score": 0.95
    }
  ],
  "enhanced_context": "Based on your query about deck building codes..."
}
```

### Blueprint Analysis

#### Analyze Blueprint (Enhanced)
```http
POST /analyze-blueprint-enhanced
Content-Type: application/json
```

**Request:**
```json
{
  "imageBase64": "base64-encoded-blueprint-image",
  "analysis_type": "blueprint",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "analysis_result": "This blueprint shows a rectangular deck...",
  "extracted_data": {
    "dimensions": {
      "length": 20,
      "width": 12
    },
    "features": ["stairs", "railing"]
  },
  "similar_blueprints": [
    {
      "id": "bp001",
      "similarity": 0.85,
      "title": "Similar Deck Design"
    }
  ]
}
```

### AI Capabilities

#### Get AI Capabilities
```http
GET /ai-capabilities
```

**Response:**
```json
{
  "available_models": [
    {
      "name": "alentwotime/llava-deckbot",
      "type": "multimodal",
      "capabilities": ["vision", "chat"]
    }
  ],
  "services": [
    {
      "name": "image_analysis",
      "status": "available"
    },
    {
      "name": "voice_transcription",
      "status": "available"
    }
  ],
  "provider": "ollama"
}
```

## Backend Python API

**Base URL:** `http://localhost:8001` (typical secondary port)

### Vision Query

#### Vision Query
```http
POST /vision-query
Content-Type: multipart/form-data
```

**Request:**
- `file` (file): Image file to analyze
- `prompt` (string, optional): Analysis prompt (default: "Describe image")

**Response:**
```json
{
  "model": "llava-deckbot",
  "response": "Image analysis result..."
}
```

#### Analyze Image (Legacy)
```http
POST /analyze-image
Content-Type: multipart/form-data
```

**Request:**
- `file` (file): Image file to analyze

**Response:**
```json
{
  "model": "llava-deckbot",
  "response": "Image analysis result..."
}
```

## Rate Limiting

### Vision Analysis Endpoints
- **Limit:** 100 requests per 15 minutes
- **Applies to:** `/vision/analyze` endpoint in Backend Service
- **Response when exceeded:**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

## Environment Configuration

### Required Environment Variables

#### AI Provider Configuration
```bash
# Set to 'ollama' or 'openai'
AI_PROVIDER=ollama

# Ollama model name
OLLAMA_MODEL_NAME=llava-deckbot

# OpenAI API key (if using OpenAI)
OPENAI_API_KEY=your_openai_key

# Hugging Face token for Difix enhancement
HF_API_TOKEN=your_hf_token
```

#### Service URLs
```bash
# Ollama base URL
OLLAMA_BASE_URL=http://localhost:11434

# Database configuration
DATABASE_URL=sqlite:///deckchatbot.db
```

### Service Dependencies

#### External Services
- **Ollama**: Local AI model serving (port 11434)
- **Hugging Face API**: Image enhancement via Difix
- **SQLite Database**: Data persistence

#### Internal Services
- **Backend Service**: Port 3001
- **AI Service**: Port 8000 (typical)
- **Frontend**: Port 3000 (typical)

## Usage Examples

### Complete Image Analysis Workflow

1. **Upload and analyze image:**
```bash
curl -X POST "http://localhost:3001/vision/analyze" \
  -F "image=@deck_sketch.jpg" \
  -F "prompt=Analyze this deck design and identify key measurements"
```

2. **Enhance image quality:**
```bash
curl -X POST "http://localhost:8000/enhance-image" \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "base64_encoded_image_data"
  }'
```

3. **Get detailed analysis with OCR:**
```bash
curl -X POST "http://localhost:8000/full-analyze" \
  -F "file=@deck_sketch.jpg"
```

### Chatbot Interaction

```bash
curl -X POST "http://localhost:8000/bot-query" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What materials do I need for a 12x16 deck?"
      }
    ]
  }'
```

### Voice Command Processing

```bash
curl -X POST "http://localhost:8000/transcribe-voice" \
  -H "Content-Type: application/json" \
  -d '{
    "audioBase64": "base64_encoded_audio_data",
    "context": {
      "user_id": "user123"
    }
  }'
```

## Notes

- All endpoints return JSON responses
- File uploads use multipart/form-data
- Base64 encoding is used for binary data in JSON requests
- Error responses include descriptive messages for debugging
- Some endpoints are currently mock implementations and return placeholder data
- The system is designed for internal use and lacks external authentication mechanisms
