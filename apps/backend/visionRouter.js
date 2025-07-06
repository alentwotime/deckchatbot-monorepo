// apps/backend/visionRouter.js

import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import cacheService from './utils/cache.js';
import { uploadLimiter } from './middleware/rateLimiting.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer with file size limits and file type validation
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';

// Helper function to generate image hash for caching
function generateImageHash(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
}

// Helper function to make AI request with retry logic
async function makeAIRequest(imagePath, prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(imagePath));
      form.append('prompt', prompt);

      const response = await axios.post(`${AI_SERVICE_URL}/vision-query`, form, {
        headers: form.getHeaders(),
        timeout: 60000, // 60 second timeout
      });

      return response.data.response;
    } catch (error) {
      console.warn(`AI request attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// POST /vision/analyze - Upload image and get vision result from LLaVA with caching
router.post('/analyze', uploadLimiter, upload.single('image'), async (req, res) => {
  let imagePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    imagePath = path.join(__dirname, req.file.path);
    const prompt = req.body.prompt || 'What is shown in this deck sketch? Identify measurements, stairs, and door.';

    // Generate cache key based on image content and prompt
    const imageHash = generateImageHash(imagePath);
    const cacheKey = cacheService.generateAIKey(prompt, imageHash);

    console.log(`🔍 Processing AI analysis request - Image hash: ${imageHash.substring(0, 8)}...`);

    // Try to get cached result first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`✅ Cache hit for AI analysis - returning cached result`);
      return res.json({ 
        success: true, 
        result: cachedResult,
        cached: true,
        cacheKey: cacheKey.substring(0, 16) + '...' // Partial key for debugging
      });
    }

    console.log(`🤖 Cache miss - making AI request to ${AI_SERVICE_URL}`);

    // Make AI request with retry logic
    const aiResult = await makeAIRequest(imagePath, prompt);

    // Cache the result for 1 hour (3600 seconds)
    // AI analysis results are expensive to compute and relatively stable
    await cacheService.set(cacheKey, aiResult, 3600);

    console.log(`✅ AI analysis complete - result cached for 1 hour`);

    res.json({ 
      success: true, 
      result: aiResult,
      cached: false,
      cacheKey: cacheKey.substring(0, 16) + '...' // Partial key for debugging
    });

  } catch (err) {
    console.error('❌ Vision analysis error:', err.message);

    // Provide more specific error messages
    let errorMessage = 'Vision model failed';
    let statusCode = 500;

    if (err.code === 'ECONNREFUSED') {
      errorMessage = 'AI service is not available. Please try again later.';
      statusCode = 503;
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = 'AI service endpoint not found.';
      statusCode = 502;
    } else if (err.message.includes('timeout')) {
      errorMessage = 'AI analysis timed out. Please try with a smaller image.';
      statusCode = 408;
    } else if (err.message.includes('file size')) {
      errorMessage = 'Image file is too large. Maximum size is 10MB.';
      statusCode = 413;
    } else if (err.message.includes('Only image files')) {
      errorMessage = 'Only image files are supported.';
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    // Clean up temp file
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp file:', cleanupError.message);
      }
    }
  }
});

// GET /vision/health - Health check for vision service
router.get('/health', async (req, res) => {
  try {
    // Test connection to AI service
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      status: 'healthy',
      aiServiceUrl: AI_SERVICE_URL,
      aiServiceStatus: response.data?.status || 'unknown',
      modelName: response.data?.model_name || 'unknown',
      availableModels: response.data?.available_models?.length || 0
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Cannot connect to AI service',
      aiServiceUrl: AI_SERVICE_URL
    });
  }
});

// POST /vision/clear-cache - Clear vision analysis cache
router.post('/clear-cache', async (req, res) => {
  try {
    // This would clear all AI-related cache entries
    // In a more sophisticated setup, you might want to clear only vision-related cache
    await cacheService.clear();

    res.json({
      success: true,
      message: 'Vision analysis cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

export default router;
