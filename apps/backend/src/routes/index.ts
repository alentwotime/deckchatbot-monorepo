import { Router } from 'express';
import chatRoutes from './chat-routes.js';
import deckRoutes from './deck-routes.js';
import uploadRoutes from './upload-routes.js';
import visualizationRoutes from './visualization-routes.js';

const router = Router();

/**
 * API Routes with /api/v1 prefix
 * 
 * All routes are prefixed with /api/v1 for versioning
 */

/**
 * Chat API endpoints
 * Base path: /api/v1/chat
 */
router.use('/chat', chatRoutes);

/**
 * Deck API endpoints
 * Base path: /api/v1/decks
 */
router.use('/decks', deckRoutes);

/**
 * File upload endpoints
 * Base path: /api/v1/upload
 */
router.use('/upload', uploadRoutes);

/**
 * Visual feature endpoints
 * Base path: /api/v1/visualization
 */
router.use('/visualization', visualizationRoutes);

/**
 * Health check endpoint
 * @route GET /api/v1/health
 * @desc API health check
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DeckChatBot API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/api/v1/chat',
      decks: '/api/v1/decks',
      upload: '/api/v1/upload',
      visualization: '/api/v1/visualization'
    }
  });
});

/**
 * API documentation endpoint
 * @route GET /api/v1/docs
 * @desc API documentation
 * @access Public
 */
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'DeckChatBot API Documentation',
    version: '1.0.0',
    endpoints: {
      chat: {
        base: '/api/v1/chat',
        endpoints: [
          'POST /message - Send a message and get AI response',
          'POST /stream - Stream AI response in real-time',
          'GET /history/:sessionId - Get chat history for a session',
          'POST /session - Create a new chat session',
          'GET /sessions/:userId - Get user sessions',
          'PUT /session/:sessionId - Update session',
          'DELETE /session/:sessionId - Delete session and its messages',
          'POST /analyze-deck - Analyze deck using AI'
        ]
      },
      decks: {
        base: '/api/v1/decks',
        endpoints: [
          'POST / - Save a deck',
          'GET /:deckId - Retrieve a deck by ID',
          'GET / - Search and filter decks',
          'PUT /:deckId - Update a deck',
          'DELETE /:deckId - Delete a deck',
          'GET /:deckId/export - Export deck in various formats',
          'POST /import - Import deck from file',
          'GET /:deckId/statistics - Get deck statistics',
          'POST /:deckId/blueprint - Generate deck blueprint (NEW)',
          'POST /:deckId/3d-model - Create 3D deck model (NEW)',
          'GET /popular - Get popular decks'
        ]
      },
      upload: {
        base: '/api/v1/upload',
        endpoints: [
          'POST /image - Upload single image',
          'POST /drawing - Upload and process drawing',
          'POST /extract-text - Extract text from uploaded image using OCR',
          'POST /recognize-cards - Recognize cards from uploaded image',
          'POST /analyze-deck-photo - Analyze deck photo (comprehensive analysis)',
          'POST /batch-process - Batch process multiple images',
          'GET /history/:userId - Get upload history for user',
          'DELETE /file/:fileId - Delete uploaded file',
          'GET /status/:operationId - Get processing status for operations'
        ]
      },
      visualization: {
        base: '/api/v1/visualization',
        endpoints: [
          'POST /blueprint - Generate deck blueprint visualization',
          'POST /3d-model - Create 3D deck model',
          'POST /process-drawing - Process uploaded drawing for deck visualization',
          'POST /deck-statistics - Generate deck statistics visualization',
          'GET /history/:userId - Get visualization history for user',
          'DELETE /:visualizationId - Delete visualization'
        ]
      }
    }
  });
});

/**
 * Catch-all route for undefined endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/v1/chat',
      '/api/v1/decks',
      '/api/v1/upload',
      '/api/v1/visualization',
      '/api/v1/health',
      '/api/v1/docs'
    ]
  });
});

export default router;
