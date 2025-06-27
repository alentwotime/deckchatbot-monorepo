"""
Core AI Functionality

This module provides core AI functionality for the DeckChatbot application,
including integration with Ollama and OpenAI.
"""

import json
import os
from typing import List, Dict, Any

import httpx

# Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")  # Default to ollama
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "llava-deckbot")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


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
