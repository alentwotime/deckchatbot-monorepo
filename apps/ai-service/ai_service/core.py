"""
Core AI Functionality

This module provides core AI functionality for the DeckChatbot application,
including integration with Ollama and OpenAI. Enhanced with multiple model support
for improved conversational AI and multi-modal capabilities.
"""

import json
import os
from typing import List, Dict, Any, Optional

import httpx

# Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")  # Default to ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Enhanced Model Configuration based on research report recommendations
MODEL_CONFIG = {
    "conversation": {
        "primary": os.getenv("CONVERSATION_MODEL", "neural-chat"),  # Neural-Chat for enhanced conversation
        "fallback": os.getenv("CONVERSATION_FALLBACK", "llama3.1:8b")  # Llama 3.1 8B as fallback
    },
    "multimodal": {
        "primary": os.getenv("MULTIMODAL_MODEL", "qwen2.5-vl"),  # Qwen 2.5-VL for visual understanding
        "fallback": os.getenv("MULTIMODAL_FALLBACK", "llava-deckbot")  # Original model as fallback
    },
    "reasoning": {
        "primary": os.getenv("REASONING_MODEL", "phi3:mini"),  # Phi-3 Mini for reasoning tasks
        "fallback": os.getenv("REASONING_FALLBACK", "neural-chat")
    }
}

# Legacy support
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", MODEL_CONFIG["multimodal"]["fallback"])


async def analyze_image_with_ollama(prompt: str, image_base64: str) -> str:
    """
    Analyze an image using Ollama.

    Args:
        prompt (str): The prompt to send to Ollama.
        image_base64 (str): The base64-encoded image.

    Returns:
        str: The analysis result.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL_NAME,
                    "prompt": prompt,
                    "images": [image_base64]
                },
                timeout=300.0,  # Increased timeout for potential large models
            )
            response.raise_for_status()
            # Ollama's /api/generate returns a stream of JSON objects, we need to parse them
            full_response = ""
            for line in response.iter_lines():
                if line:
                    try:
                        json_data = json.loads(line)
                        if "response" in json_data:
                            full_response += json_data["response"]
                    except json.JSONDecodeError:
                        continue  # Skip lines that are not valid JSON
            return full_response
    except Exception as e:
        raise Exception(f"Ollama image analysis error: {str(e)}")


async def chat_with_ollama(messages: List[Dict[str, Any]], options: Dict[str, Any] = {}) -> str:
    """
    Chat with Ollama.

    Args:
        messages (List[Dict[str, Any]]): The messages to send to Ollama.
        options (Dict[str, Any], optional): Options for the chat. Defaults to {}.

    Returns:
        str: The chat response.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Ollama chat endpoint structure
            ollama_messages = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in messages
            ]
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL_NAME,
                    "messages": ollama_messages,
                    "options": options  # Pass along any options
                },
                timeout=300.0,
            )
        response.raise_for_status()
        # Ollama /api/chat also returns a stream of JSON objects
        full_response_content = ""
        for line in response.iter_lines():
            if line:
                try:
                    json_data = json.loads(line)
                    if "message" in json_data and "content" in json_data["message"]:
                        full_response_content += json_data["message"]["content"]
                except json.JSONDecodeError:
                    continue
        return full_response_content
    except Exception as e:
        raise Exception(f"Ollama chat error: {str(e)}")


async def get_best_model_for_task(task_type: str) -> str:
    """
    Get the best available model for a specific task type.

    Args:
        task_type (str): The type of task ('conversation', 'multimodal', 'reasoning')

    Returns:
        str: The model name to use
    """
    if task_type not in MODEL_CONFIG:
        return OLLAMA_MODEL_NAME

    # Try primary model first, fallback if not available
    primary_model = MODEL_CONFIG[task_type]["primary"]
    fallback_model = MODEL_CONFIG[task_type]["fallback"]

    try:
        # Check if primary model is available
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10.0)
            if response.status_code == 200:
                available_models = [model["name"] for model in response.json().get("models", [])]
                if primary_model in available_models:
                    return primary_model
                elif fallback_model in available_models:
                    return fallback_model
    except Exception:
        pass  # Fall through to return fallback

    return fallback_model


async def enhanced_chat_with_context(messages: List[Dict[str, Any]], task_type: str = "conversation", 
                                   options: Dict[str, Any] = {}) -> str:
    """
    Enhanced chat function that selects the best model based on task type.

    Args:
        messages (List[Dict[str, Any]]): The messages to send
        task_type (str): The type of task to optimize for
        options (Dict[str, Any], optional): Options for the chat

    Returns:
        str: The chat response
    """
    model_name = await get_best_model_for_task(task_type)

    try:
        async with httpx.AsyncClient() as client:
            ollama_messages = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in messages
            ]

            # Enhanced options based on task type
            enhanced_options = options.copy()
            if task_type == "reasoning":
                enhanced_options.update({"temperature": 0.1, "top_p": 0.9})
            elif task_type == "conversation":
                enhanced_options.update({"temperature": 0.7, "top_p": 0.9})

            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": model_name,
                    "messages": ollama_messages,
                    "options": enhanced_options
                },
                timeout=300.0,
            )
            response.raise_for_status()

            full_response_content = ""
            for line in response.iter_lines():
                if line:
                    try:
                        json_data = json.loads(line)
                        if "message" in json_data and "content" in json_data["message"]:
                            full_response_content += json_data["message"]["content"]
                    except json.JSONDecodeError:
                        continue
            return full_response_content
    except Exception as e:
        raise Exception(f"Enhanced chat error with model {model_name}: {str(e)}")


async def analyze_image_with_enhanced_multimodal(prompt: str, image_base64: str, 
                                                analysis_type: str = "blueprint") -> str:
    """
    Enhanced image analysis using the best available multimodal model.

    Args:
        prompt (str): The prompt to send
        image_base64 (str): The base64-encoded image
        analysis_type (str): Type of analysis ('blueprint', 'general', 'technical')

    Returns:
        str: The analysis result
    """
    model_name = await get_best_model_for_task("multimodal")

    # Enhanced prompts based on analysis type
    enhanced_prompts = {
        "blueprint": f"As a deck design expert, analyze this blueprint image. {prompt} Focus on dimensions, structural elements, and construction details.",
        "technical": f"Provide a technical analysis of this image. {prompt} Include measurements, materials, and engineering considerations.",
        "general": prompt
    }

    final_prompt = enhanced_prompts.get(analysis_type, prompt)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model_name,
                    "prompt": final_prompt,
                    "images": [image_base64],
                    "options": {
                        "temperature": 0.2,  # Lower temperature for more precise analysis
                        "top_p": 0.9
                    }
                },
                timeout=300.0,
            )
            response.raise_for_status()

            full_response = ""
            for line in response.iter_lines():
                if line:
                    try:
                        json_data = json.loads(line)
                        if "response" in json_data:
                            full_response += json_data["response"]
                    except json.JSONDecodeError:
                        continue
            return full_response
    except Exception as e:
        raise Exception(f"Enhanced multimodal analysis error with model {model_name}: {str(e)}")


async def process_deck_design_query(query: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Process deck design queries using reasoning-optimized models.

    Args:
        query (str): The deck design query
        context (Optional[Dict[str, Any]]): Additional context (measurements, materials, etc.)

    Returns:
        str: The processed response
    """
    messages = []

    # Add context if provided
    if context:
        context_str = f"Context: {json.dumps(context, indent=2)}"
        messages.append({"role": "system", "content": context_str})

    # Add system message for deck design expertise
    system_message = """You are DeckChatbot AI, an expert in deck design and construction. 
    You help sales professionals by analyzing blueprints, calculating materials, and providing 
    technical guidance. Always provide clear, actionable advice with specific measurements 
    and material recommendations when possible."""

    messages.extend([
        {"role": "system", "content": system_message},
        {"role": "user", "content": query}
    ])

    return await enhanced_chat_with_context(messages, task_type="reasoning")
