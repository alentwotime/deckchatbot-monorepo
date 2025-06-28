import express from 'express';
import multer from 'multer';
import dbService from './utils/db.js';
import cacheService from './utils/cache.js';
import { uploadLimiter, dbLimiter } from './middleware/rateLimiting.js';
import { validateRequest, secureFileUpload, InputSanitizer } from './middleware/security.js';

const router = express.Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Basic hello endpoint
router.get('/hello', (req, res) => {
  res.json({ 
    message: 'Hello from DeckChatbot Backend!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// File upload endpoint with caching and security validation
router.post('/upload-file', uploadLimiter, upload.single('file'), secureFileUpload, validateRequest({
  body: {
    type: { type: 'string', required: false, maxLength: 50 }
  }
}), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    const { originalname, mimetype, size, filename } = req.file;
    const fileType = req.body.type || 'unknown';

    // Store file metadata in database (example)
    const fileRecord = await dbService.query(
      `INSERT INTO files (original_name, mime_type, size, file_type, file_path, uploaded_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, original_name, uploaded_at`,
      [originalname, mimetype, size, fileType, filename]
    );

    res.json({
      success: true,
      file: {
        id: fileRecord.rows[0].id,
        originalName: fileRecord.rows[0].original_name,
        uploadedAt: fileRecord.rows[0].uploaded_at,
        size,
        type: fileType
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Analyze files endpoint with caching
router.post('/analyze-files', dbLimiter, async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'Files array is required'
      });
    }

    // Generate cache key based on file IDs
    const fileIds = files.map(f => f.id).sort().join(',');
    const cacheKey = `analysis:files:${fileIds}`;

    // Check cache first
    const cachedAnalysis = await cacheService.get(cacheKey);
    if (cachedAnalysis) {
      return res.json({
        success: true,
        analysis: cachedAnalysis,
        cached: true
      });
    }

    // Perform analysis (placeholder - integrate with actual analysis logic)
    const analysis = {
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
      types: [...new Set(files.map(f => f.type))],
      analysisDate: new Date().toISOString(),
      recommendations: [
        'Consider optimizing image sizes for better performance',
        'Ensure all measurements are clearly visible',
        'Include multiple angles for comprehensive analysis'
      ]
    };

    // Cache the analysis for 30 minutes
    await cacheService.set(cacheKey, analysis, 1800);

    // Store analysis in database
    await dbService.query(
      `INSERT INTO analyses (file_ids, analysis_data, created_at) 
       VALUES ($1, $2, NOW())`,
      [fileIds, JSON.stringify(analysis)]
    );

    res.json({
      success: true,
      analysis,
      cached: false
    });

  } catch (error) {
    console.error('File analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'File analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate blueprint endpoint with caching
router.post('/generate-blueprint', dbLimiter, async (req, res) => {
  try {
    const { analysisData } = req.body;

    if (!analysisData) {
      return res.status(400).json({
        success: false,
        error: 'Analysis data is required'
      });
    }

    // Generate cache key based on analysis data
    const analysisHash = Buffer.from(JSON.stringify(analysisData)).toString('base64').slice(0, 20);
    const cacheKey = `blueprint:${analysisHash}`;

    // Check cache first
    const cachedBlueprint = await cacheService.get(cacheKey);
    if (cachedBlueprint) {
      return res.json({
        success: true,
        blueprint: cachedBlueprint,
        cached: true
      });
    }

    // Generate blueprint (placeholder - integrate with actual blueprint generation)
    const blueprint = {
      id: `bp_${Date.now()}`,
      title: 'Generated Deck Blueprint',
      dimensions: {
        length: analysisData.estimatedLength || 12,
        width: analysisData.estimatedWidth || 8,
        height: analysisData.estimatedHeight || 3
      },
      materials: [
        { item: 'Pressure-treated lumber (2x8)', quantity: 12, unit: 'pieces' },
        { item: 'Deck boards (5/4x6)', quantity: 25, unit: 'pieces' },
        { item: 'Galvanized screws', quantity: 5, unit: 'lbs' },
        { item: 'Concrete footings', quantity: 6, unit: 'pieces' }
      ],
      estimatedCost: {
        materials: 1200,
        labor: 800,
        total: 2000
      },
      generatedAt: new Date().toISOString()
    };

    // Cache the blueprint for 2 hours
    await cacheService.set(cacheKey, blueprint, 7200);

    // Store blueprint in database
    await dbService.query(
      `INSERT INTO blueprints (blueprint_data, analysis_hash, created_at) 
       VALUES ($1, $2, NOW())`,
      [JSON.stringify(blueprint), analysisHash]
    );

    res.json({
      success: true,
      blueprint,
      cached: false
    });

  } catch (error) {
    console.error('Blueprint generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Blueprint generation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bot query endpoint with caching and input validation
router.post('/bot-query', dbLimiter, validateRequest({
  body: {
    messages: { type: 'array', required: true, maxItems: 50 },
    options: { type: 'object', required: false }
  }
}), async (req, res) => {
  try {
    const { messages, options = {} } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    // Generate cache key based on conversation context
    const conversationHash = Buffer.from(JSON.stringify(messages.slice(-3))).toString('base64').slice(0, 20);
    const cacheKey = `bot:${conversationHash}`;

    // Check cache for recent similar conversations
    const cachedResponse = await cacheService.get(cacheKey);
    if (cachedResponse && !options.skipCache) {
      return res.json({
        success: true,
        response: cachedResponse,
        cached: true
      });
    }

    // Sanitize user messages before processing
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      content: InputSanitizer.sanitizeString(msg.content || '', 1000)
    }));

    // Generate bot response (placeholder - integrate with actual AI chatbot)
    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    let response = "I'm here to help with your deck project! ";

    if (lastMessage.content.toLowerCase().includes('material')) {
      response += "For deck materials, I recommend pressure-treated lumber for the frame and composite decking for the surface. This provides durability and low maintenance.";
    } else if (lastMessage.content.toLowerCase().includes('cost')) {
      response += "Deck costs typically range from $15-40 per square foot, depending on materials and complexity. A 12x16 deck might cost $3,000-$7,500.";
    } else if (lastMessage.content.toLowerCase().includes('permit')) {
      response += "Most decks require building permits, especially if they're over 30 inches high or attached to the house. Check with your local building department.";
    } else {
      response += "Could you provide more details about your deck project? I can help with materials, costs, permits, design, and construction questions.";
    }

    // Cache the response for 10 minutes
    await cacheService.set(cacheKey, response, 600);

    res.json({
      success: true,
      response,
      cached: false
    });

  } catch (error) {
    console.error('Bot query error:', error);
    res.status(500).json({
      success: false,
      error: 'Bot query failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get cached data statistics
router.get('/cache/stats', dbLimiter, async (req, res) => {
  try {
    // This is a placeholder - implement based on your cache service capabilities
    res.json({
      success: true,
      stats: {
        message: 'Cache statistics endpoint',
        note: 'Implement detailed cache statistics based on Redis/memory cache'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
