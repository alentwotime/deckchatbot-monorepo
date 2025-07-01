import { Router } from 'express';
import { ChatController } from '../controllers/chat-controller.js';

const router = Router();
const chatController = new ChatController();

/**
 * @route POST /api/v1/chat/message
 * @desc Send a message and get AI response
 * @access Public
 */
router.post('/message', chatController.sendMessage);

/**
 * @route POST /api/v1/chat/stream
 * @desc Stream AI response in real-time
 * @access Public
 */
router.post('/stream', chatController.streamMessage);

/**
 * @route GET /api/v1/chat/history/:sessionId
 * @desc Get chat history for a session
 * @access Public
 */
router.get('/history/:sessionId', chatController.getChatHistory);

/**
 * @route POST /api/v1/chat/session
 * @desc Create a new chat session
 * @access Public
 */
router.post('/session', chatController.createSession);

/**
 * @route GET /api/v1/chat/sessions/:userId
 * @desc Get user sessions
 * @access Public
 */
router.get('/sessions/:userId', chatController.getUserSessions);

/**
 * @route PUT /api/v1/chat/session/:sessionId
 * @desc Update session
 * @access Public
 */
router.put('/session/:sessionId', chatController.updateSession);

/**
 * @route DELETE /api/v1/chat/session/:sessionId
 * @desc Delete session and its messages
 * @access Public
 */
router.delete('/session/:sessionId', chatController.deleteSession);

/**
 * @route POST /api/v1/chat/analyze-deck
 * @desc Analyze deck using AI
 * @access Public
 */
router.post('/analyze-deck', chatController.analyzeDeck);

export default router;
