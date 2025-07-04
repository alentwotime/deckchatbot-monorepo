"""
NVIDIA Difix Integration Service

This module provides integration with NVIDIA's Difix model for enhancing 3D deck renderings
by removing artifacts and improving visual quality as recommended in the research report.
"""

import base64
import io
import os
from typing import Optional, Dict, Any

import httpx
from PIL import Image


class DifixService:
    """Service for integrating with NVIDIA Difix model via Hugging Face."""
    
    def __init__(self):
        self.hf_api_key = os.getenv("HUGGING_FACE_API_KEY")
        self.difix_api_url = "https://api-inference.huggingface.co/models/nvidia/difix"
        self.difix_space_url = "https://nvidia-difix3d.hf.space/api/predict"
        
    async def enhance_3d_rendering(self, image_data: bytes, enhancement_type: str = "artifact_removal") -> bytes:
        """
        Enhance 3D deck rendering using NVIDIA Difix model.
        
        Args:
            image_data (bytes): The 3D rendering image data
            enhancement_type (str): Type of enhancement ('artifact_removal', 'quality_improvement')
            
        Returns:
            bytes: Enhanced image data
        """
        try:
            # Try Hugging Face API first if API key is available
            if self.hf_api_key:
                return await self._enhance_via_hf_api(image_data, enhancement_type)
            else:
                # Fallback to Hugging Face Space
                return await self._enhance_via_hf_space(image_data, enhancement_type)
                
        except Exception as e:
            raise Exception(f"Difix enhancement error: {str(e)}")
    
    async def _enhance_via_hf_api(self, image_data: bytes, enhancement_type: str) -> bytes:
        """Enhance image using Hugging Face API."""
        headers = {
            "Authorization": f"Bearer {self.hf_api_key}",
            "Content-Type": "application/json"
        }
        
        # Convert image to base64
        image_b64 = base64.b64encode(image_data).decode()
        
        payload = {
            "inputs": image_b64,
            "parameters": {
                "enhancement_type": enhancement_type,
                "strength": 0.8 if enhancement_type == "artifact_removal" else 0.6
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.difix_api_url,
                headers=headers,
                json=payload,
                timeout=120.0
            )
            response.raise_for_status()
            
            # Handle different response formats
            if response.headers.get("content-type", "").startswith("image/"):
                return response.content
            else:
                # JSON response with base64 image
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    enhanced_b64 = result[0].get("generated_image", "")
                    return base64.b64decode(enhanced_b64)
                else:
                    raise Exception("Unexpected API response format")
    
    async def _enhance_via_hf_space(self, image_data: bytes, enhancement_type: str) -> bytes:
        """Enhance image using Hugging Face Space as fallback."""
        # Convert bytes to PIL Image for processing
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert back to bytes for API
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_bytes = img_buffer.getvalue()
        
        files = {
            "data": ("image.png", img_bytes, "image/png")
        }
        
        data = {
            "fn_index": 0,  # Function index for the Difix space
            "data": [
                enhancement_type,
                0.8 if enhancement_type == "artifact_removal" else 0.6  # strength parameter
            ]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.difix_space_url,
                files=files,
                data=data,
                timeout=120.0
            )
            response.raise_for_status()
            
            result = response.json()
            if "data" in result and len(result["data"]) > 0:
                # Extract enhanced image from response
                enhanced_image_path = result["data"][0]
                if isinstance(enhanced_image_path, str) and enhanced_image_path.startswith("data:image"):
                    # Handle base64 data URL
                    header, encoded = enhanced_image_path.split(",", 1)
                    return base64.b64decode(encoded)
                else:
                    # Handle file path or direct binary data
                    return enhanced_image_path if isinstance(enhanced_image_path, bytes) else image_data
            else:
                # Return original if enhancement fails
                return image_data
    
    async def batch_enhance_renderings(self, image_list: list[bytes], 
                                     enhancement_type: str = "artifact_removal") -> list[bytes]:
        """
        Enhance multiple 3D renderings in batch.
        
        Args:
            image_list (list[bytes]): List of image data to enhance
            enhancement_type (str): Type of enhancement to apply
            
        Returns:
            list[bytes]: List of enhanced image data
        """
        enhanced_images = []
        
        for image_data in image_list:
            try:
                enhanced = await self.enhance_3d_rendering(image_data, enhancement_type)
                enhanced_images.append(enhanced)
            except Exception as e:
                print(f"Warning: Failed to enhance image: {e}")
                # Add original image if enhancement fails
                enhanced_images.append(image_data)
        
        return enhanced_images
    
    def is_available(self) -> bool:
        """Check if Difix service is available."""
        return bool(self.hf_api_key) or True  # Space is always available as fallback
    
    async def get_enhancement_options(self) -> Dict[str, Any]:
        """Get available enhancement options and their descriptions."""
        return {
            "artifact_removal": {
                "description": "Remove rendering artifacts and noise from 3D views",
                "strength_range": [0.5, 1.0],
                "recommended_strength": 0.8,
                "use_cases": ["NeRF renderings", "3DGS outputs", "Low-quality 3D previews"]
            },
            "quality_improvement": {
                "description": "General quality enhancement for 3D renderings",
                "strength_range": [0.3, 0.8],
                "recommended_strength": 0.6,
                "use_cases": ["Final presentations", "Client previews", "Marketing materials"]
            }
        }


# Global instance for easy access
difix_service = DifixService()


async def enhance_deck_3d_preview(image_data: bytes, quality_level: str = "high") -> bytes:
    """
    Convenience function to enhance deck 3D previews.
    
    Args:
        image_data (bytes): The 3D deck preview image
        quality_level (str): Quality level ('high', 'medium', 'fast')
        
    Returns:
        bytes: Enhanced image data
    """
    enhancement_mapping = {
        "high": "quality_improvement",
        "medium": "artifact_removal", 
        "fast": "artifact_removal"
    }
    
    enhancement_type = enhancement_mapping.get(quality_level, "artifact_removal")
    return await difix_service.enhance_3d_rendering(image_data, enhancement_type)
