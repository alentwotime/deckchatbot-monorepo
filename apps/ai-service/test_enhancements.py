"""
Test script for AI enhancements implementation.

This script tests the basic functionality of the enhanced AI services
to ensure they are working correctly.
"""

import asyncio
import base64
import json
from typing import Dict, Any

# Test the enhanced AI services
async def test_enhanced_services():
    """Test all enhanced AI services."""
    print("🧪 Testing Enhanced AI Services")
    print("=" * 50)
    
    # Test 1: Core AI functionality
    print("\n1. Testing Enhanced Core AI...")
    try:
        from ai_service.core import get_best_model_for_task, MODEL_CONFIG
        
        # Test model selection
        conversation_model = await get_best_model_for_task("conversation")
        multimodal_model = await get_best_model_for_task("multimodal")
        reasoning_model = await get_best_model_for_task("reasoning")
        
        print(f"✓ Conversation model: {conversation_model}")
        print(f"✓ Multimodal model: {multimodal_model}")
        print(f"✓ Reasoning model: {reasoning_model}")
        print(f"✓ Model configuration loaded: {len(MODEL_CONFIG)} task types")
        
    except Exception as e:
        print(f"❌ Core AI test failed: {e}")
    
    # Test 2: Vector Database Service
    print("\n2. Testing Vector Database Service...")
    try:
        from ai_service.vector_db_service import vector_db_service
        
        # Test basic functionality
        stats = vector_db_service.get_collection_stats()
        print(f"✓ Vector DB collections: {stats}")
        
        # Test knowledge search
        test_query = "deck joist spacing"
        results = await vector_db_service.search_deck_knowledge(test_query, n_results=2)
        print(f"✓ Knowledge search returned {len(results)} results")
        
        if results:
            print(f"  - Sample result: {results[0]['content'][:100]}...")
        
    except Exception as e:
        print(f"❌ Vector DB test failed: {e}")
    
    # Test 3: Whisper Service
    print("\n3. Testing Whisper ASR Service...")
    try:
        from ai_service.whisper_service import whisper_service
        
        # Test model info
        model_info = await whisper_service.get_model_info()
        print(f"✓ Whisper model: {model_info['model_size']}")
        print(f"✓ Supported formats: {len(model_info['supported_formats'])}")
        print(f"✓ Supported languages: {len(model_info['supported_languages'])}")
        
    except Exception as e:
        print(f"❌ Whisper test failed: {e}")
    
    # Test 4: Difix Service
    print("\n4. Testing Difix Service...")
    try:
        from ai_service.difix_service import difix_service
        
        # Test availability
        is_available = difix_service.is_available()
        print(f"✓ Difix service available: {is_available}")
        
        # Test enhancement options
        options = await difix_service.get_enhancement_options()
        print(f"✓ Enhancement options: {list(options.keys())}")
        
    except Exception as e:
        print(f"❌ Difix test failed: {e}")
    
    # Test 5: Enhanced Query Processing
    print("\n5. Testing Enhanced Query Processing...")
    try:
        from ai_service.vector_db_service import enhance_query_with_context
        
        # Test context enhancement
        test_query = "What is the standard deck railing height?"
        enhanced = await enhance_query_with_context(test_query)
        
        print(f"✓ Original query: {enhanced['original_query']}")
        print(f"✓ Enhanced context length: {len(enhanced['enhanced_context'])}")
        print(f"✓ Relevant knowledge items: {len(enhanced['relevant_knowledge'])}")
        
    except Exception as e:
        print(f"❌ Enhanced query test failed: {e}")


async def test_api_models():
    """Test the Pydantic models for API endpoints."""
    print("\n6. Testing API Models...")
    try:
        from ai_service.main import (
            EnhancedChatRequest, EnhancedChatResponse,
            DifixEnhanceRequest, DifixEnhanceResponse,
            VoiceTranscriptionRequest, VoiceTranscriptionResponse,
            KnowledgeSearchRequest, KnowledgeSearchResponse,
            BlueprintAnalysisRequest, BlueprintAnalysisResponse
        )
        
        # Test model creation
        chat_request = EnhancedChatRequest(
            messages=[{"role": "user", "content": "Test message"}],
            task_type="conversation"
        )
        print(f"✓ EnhancedChatRequest: {chat_request.task_type}")
        
        difix_request = DifixEnhanceRequest(
            imageBase64="test_base64_data",
            quality_level="high"
        )
        print(f"✓ DifixEnhanceRequest: {difix_request.quality_level}")
        
        voice_request = VoiceTranscriptionRequest(
            audioBase64="test_audio_data"
        )
        print(f"✓ VoiceTranscriptionRequest created")
        
        knowledge_request = KnowledgeSearchRequest(
            query="test query",
            n_results=5
        )
        print(f"✓ KnowledgeSearchRequest: {knowledge_request.n_results} results")
        
        blueprint_request = BlueprintAnalysisRequest(
            imageBase64="test_image_data",
            analysis_type="blueprint"
        )
        print(f"✓ BlueprintAnalysisRequest: {blueprint_request.analysis_type}")
        
        print("✓ All API models validated successfully")
        
    except Exception as e:
        print(f"❌ API models test failed: {e}")


def test_configuration():
    """Test configuration and environment setup."""
    print("\n7. Testing Configuration...")
    try:
        import os
        from ai_service.core import MODEL_CONFIG, OLLAMA_BASE_URL
        
        print(f"✓ Ollama base URL: {OLLAMA_BASE_URL}")
        print(f"✓ Model configuration keys: {list(MODEL_CONFIG.keys())}")
        
        # Check environment variables
        env_vars = [
            "CONVERSATION_MODEL", "MULTIMODAL_MODEL", "REASONING_MODEL",
            "HUGGING_FACE_API_KEY", "AI_PROVIDER"
        ]
        
        for var in env_vars:
            value = os.getenv(var, "Not set")
            status = "✓" if value != "Not set" else "⚠️"
            print(f"{status} {var}: {value}")
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")


async def main():
    """Run all tests."""
    print("🚀 Starting AI Enhancements Test Suite")
    print("=" * 60)
    
    # Run tests
    await test_enhanced_services()
    await test_api_models()
    test_configuration()
    
    print("\n" + "=" * 60)
    print("🏁 Test Suite Complete")
    print("\nNote: Some tests may show warnings if models are not yet downloaded.")
    print("This is normal for the initial setup. Run 'ollama pull <model>' to download models.")
    print("\nRecommended models to pull:")
    print("- ollama pull neural-chat")
    print("- ollama pull llama3.1:8b") 
    print("- ollama pull qwen2.5-vl")
    print("- ollama pull phi3:mini")


if __name__ == "__main__":
    asyncio.run(main())
