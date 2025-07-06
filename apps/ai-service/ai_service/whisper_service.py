"""
Whisper ASR Service for Voice Interaction

This module provides automatic speech recognition capabilities using OpenAI's Whisper
for voice interaction with deck presentations as recommended in the research report.
"""

import os
import io
import tempfile
from typing import Optional, Dict, Any, Union
import asyncio
from pathlib import Path

# Try to import whisper and soundfile, but provide fallbacks if they're not available
try:
    import whisper
    import soundfile as sf
    WHISPER_AVAILABLE = True
except ImportError:
    print("Warning: whisper or soundfile not available. Using stub implementation.")
    WHISPER_AVAILABLE = False

import numpy as np
from pydantic import BaseModel


class TranscriptionResult(BaseModel):
    """Model for transcription results."""
    text: str
    language: str
    confidence: float
    segments: list = []


class WhisperService:
    """Service for speech recognition using OpenAI Whisper."""

    def __init__(self, model_size: str = "base"):
        """
        Initialize Whisper service.

        Args:
            model_size (str): Whisper model size ('tiny', 'base', 'small', 'medium', 'large')
        """
        self.model_size = model_size
        self.model = None
        self.supported_formats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
        self.is_available = WHISPER_AVAILABLE

    async def load_model(self):
        """Load the Whisper model asynchronously."""
        if not self.is_available:
            print("Warning: Whisper is not available. Cannot load model.")
            return

        if self.model is None:
            try:
                # Run model loading in thread pool to avoid blocking
                loop = asyncio.get_event_loop()
                self.model = await loop.run_in_executor(None, whisper.load_model, self.model_size)
            except Exception as e:
                print(f"Error loading Whisper model: {e}")
                self.is_available = False

    async def transcribe_audio(self, audio_data: Union[bytes, str, Path], 
                             language: Optional[str] = None,
                             task: str = "transcribe") -> TranscriptionResult:
        """
        Transcribe audio data to text.

        Args:
            audio_data (Union[bytes, str, Path]): Audio data as bytes, file path, or Path object
            language (Optional[str]): Language code (e.g., 'en', 'es', 'fr')
            task (str): Task type ('transcribe' or 'translate')

        Returns:
            TranscriptionResult: Transcription result with text and metadata
        """
        if not self.is_available:
            print("Warning: Whisper is not available. Returning default transcription result.")
            return TranscriptionResult(
                text="[Transcription unavailable - Whisper not installed]",
                language="unknown",
                confidence=0.0,
                segments=[]
            )

        await self.load_model()

        if not self.model:
            print("Warning: Whisper model could not be loaded. Returning default transcription result.")
            return TranscriptionResult(
                text="[Transcription unavailable - Model loading failed]",
                language="unknown",
                confidence=0.0,
                segments=[]
            )

        # Handle different input types
        if isinstance(audio_data, bytes):
            audio_file = await self._bytes_to_temp_file(audio_data)
        else:
            audio_file = str(audio_data)

        try:
            # Run transcription in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                self._transcribe_file, 
                audio_file, 
                language, 
                task
            )

            return TranscriptionResult(
                text=result["text"].strip(),
                language=result.get("language", "unknown"),
                confidence=self._calculate_confidence(result),
                segments=result.get("segments", [])
            )
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return TranscriptionResult(
                text=f"[Transcription error: {str(e)}]",
                language="unknown",
                confidence=0.0,
                segments=[]
            )
        finally:
            # Clean up temporary file if created
            if isinstance(audio_data, bytes) and os.path.exists(audio_file):
                os.unlink(audio_file)

    def _transcribe_file(self, audio_file: str, language: Optional[str], task: str) -> Dict[str, Any]:
        """Synchronous transcription method for thread pool execution."""
        options = {
            "task": task,
            "fp16": False,  # Disable FP16 for better compatibility
        }

        if language:
            options["language"] = language

        return self.model.transcribe(audio_file, **options)

    async def _bytes_to_temp_file(self, audio_bytes: bytes) -> str:
        """Convert audio bytes to temporary file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_bytes)
            return temp_file.name

    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """Calculate average confidence from segments."""
        segments = result.get("segments", [])
        if not segments:
            return 0.8  # Default confidence if no segments

        # Calculate average confidence from segments
        confidences = []
        for segment in segments:
            if "avg_logprob" in segment:
                # Convert log probability to confidence score
                confidence = min(1.0, max(0.0, np.exp(segment["avg_logprob"])))
                confidences.append(confidence)

        return np.mean(confidences) if confidences else 0.8

    async def transcribe_deck_command(self, audio_data: Union[bytes, str, Path]) -> Dict[str, Any]:
        """
        Transcribe audio specifically for deck design commands.

        Args:
            audio_data: Audio data to transcribe

        Returns:
            Dict[str, Any]: Transcription with deck-specific processing
        """
        if not self.is_available:
            default_text = "[Transcription unavailable - Whisper not installed]"
            return {
                "original_text": default_text,
                "processed_command": {"type": "unavailable", "processed_text": default_text},
                "language": "unknown",
                "confidence": 0.0,
                "command_type": "unavailable"
            }

        result = await self.transcribe_audio(audio_data, language="en", task="transcribe")

        # Process for deck-specific commands
        processed_result = await self._process_deck_commands(result.text)

        return {
            "original_text": result.text,
            "processed_command": processed_result,
            "language": result.language,
            "confidence": result.confidence,
            "command_type": processed_result.get("type", "general")
        }

    async def _process_deck_commands(self, text: str) -> Dict[str, Any]:
        """Process transcribed text for deck-specific commands."""
        text_lower = text.lower()

        # Define command patterns
        command_patterns = {
            "measurement": ["measure", "dimension", "size", "length", "width", "height", "feet", "inches"],
            "material": ["wood", "composite", "lumber", "railing", "decking", "joist", "beam"],
            "navigation": ["next", "previous", "back", "forward", "stage", "step"],
            "action": ["calculate", "analyze", "show", "display", "generate", "create"],
            "modification": ["change", "modify", "adjust", "update", "edit", "move"]
        }

        # Detect command type
        detected_commands = []
        for command_type, keywords in command_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_commands.append(command_type)

        # Extract numbers (potential measurements)
        import re
        numbers = re.findall(r'\d+(?:\.\d+)?', text)

        return {
            "type": detected_commands[0] if detected_commands else "general",
            "all_types": detected_commands,
            "extracted_numbers": numbers,
            "processed_text": text,
            "confidence_level": "high" if detected_commands else "medium"
        }

    async def batch_transcribe(self, audio_files: list) -> list[TranscriptionResult]:
        """
        Transcribe multiple audio files in batch.

        Args:
            audio_files (list): List of audio file paths or bytes

        Returns:
            list[TranscriptionResult]: List of transcription results
        """
        if not self.is_available:
            # Return default results for all files if whisper is not available
            return [
                TranscriptionResult(
                    text="[Transcription unavailable - Whisper not installed]",
                    language="unknown",
                    confidence=0.0,
                    segments=[]
                )
                for _ in audio_files
            ]

        results = []

        for audio_file in audio_files:
            try:
                result = await self.transcribe_audio(audio_file)
                results.append(result)
            except Exception as e:
                # Add error result for failed transcriptions
                results.append(TranscriptionResult(
                    text=f"Transcription failed: {str(e)}",
                    language="unknown",
                    confidence=0.0,
                    segments=[]
                ))

        return results

    def get_supported_formats(self) -> list[str]:
        """Get list of supported audio formats."""
        return self.supported_formats.copy()

    def is_format_supported(self, file_path: str) -> bool:
        """Check if audio format is supported."""
        return Path(file_path).suffix.lower() in self.supported_formats

    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        if not self.is_available:
            return {
                "model_size": "unavailable",
                "supported_languages": [],
                "supported_formats": [],
                "tasks": [],
                "max_audio_length": "0",
                "status": "Whisper not installed",
                "available": False
            }

        await self.load_model()

        return {
            "model_size": self.model_size,
            "supported_languages": ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"],
            "supported_formats": self.supported_formats,
            "tasks": ["transcribe", "translate"],
            "max_audio_length": "30 seconds recommended for real-time use",
            "status": "loaded" if self.model else "not loaded",
            "available": True
        }


# Global instance for easy access
whisper_service = WhisperService(model_size="base")


async def transcribe_voice_command(audio_data: Union[bytes, str, Path]) -> Dict[str, Any]:
    """
    Convenience function to transcribe voice commands for deck design.

    Args:
        audio_data: Audio data to transcribe

    Returns:
        Dict[str, Any]: Transcription result with deck-specific processing
    """
    return await whisper_service.transcribe_deck_command(audio_data)


async def process_voice_interaction(audio_data: Union[bytes, str, Path], 
                                  context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Process voice interaction for deck design workflow.

    Args:
        audio_data: Audio data to process
        context: Optional context about current deck design stage

    Returns:
        Dict[str, Any]: Processed voice interaction result
    """
    # Transcribe the audio
    transcription_result = await whisper_service.transcribe_deck_command(audio_data)

    # Add context-aware processing
    if context:
        current_stage = context.get("stage", "unknown")
        stage_specific_processing = {
            "upload": "Focus on file upload commands and navigation",
            "analysis": "Focus on measurement and calculation commands", 
            "blueprint": "Focus on editing and modification commands",
            "3d_preview": "Focus on visualization and material commands"
        }

        transcription_result["stage_context"] = current_stage
        transcription_result["stage_guidance"] = stage_specific_processing.get(current_stage, "General deck design commands")

    return transcription_result
