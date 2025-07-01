import { AzureOpenAIService } from '../services/azure-openai.js';
import { AzureCosmosService } from '../services/azure-cosmos.js';
export class ChatController {
    openAIService;
    cosmosService;
    constructor() {
        this.openAIService = AzureOpenAIService.getInstance();
        this.cosmosService = AzureCosmosService.getInstance();
    }
    /**
     * Send a message and get AI response
     */
    sendMessage = async (req, res) => {
        try {
            const { message, sessionId, userId, context } = req.body;
            if (!message || !sessionId || !userId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: message, sessionId, userId'
                });
                return;
            }
            // Store user message
            const userMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId,
                userId,
                content: message,
                role: 'user',
                timestamp: new Date(),
                metadata: context ? { context } : undefined
            };
            await this.cosmosService.storeChatMessage(userMessage);
            // Get chat history for context
            const chatHistory = await this.cosmosService.getChatMessages(sessionId, { limit: 10 });
            // Prepare messages for OpenAI
            const messages = chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            // Get AI response
            const aiResponse = await this.openAIService.createChatCompletion({
                messages,
                maxTokens: 1000,
                temperature: 0.7
            });
            // Store AI response
            const assistantMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId,
                userId,
                content: aiResponse.content,
                role: 'assistant',
                timestamp: new Date(),
                metadata: {
                    model: aiResponse.model,
                    usage: aiResponse.usage
                }
            };
            await this.cosmosService.storeChatMessage(assistantMessage);
            res.json({
                success: true,
                data: {
                    message: assistantMessage,
                    usage: aiResponse.usage
                }
            });
        }
        catch (error) {
            console.error('Error in sendMessage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process message'
            });
        }
    };
    /**
     * Stream AI response in real-time
     */
    streamMessage = async (req, res) => {
        try {
            const { message, sessionId, userId, context } = req.body;
            if (!message || !sessionId || !userId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: message, sessionId, userId'
                });
                return;
            }
            // Set up SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            // Store user message
            const userMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId,
                userId,
                content: message,
                role: 'user',
                timestamp: new Date(),
                metadata: context ? { context } : undefined
            };
            await this.cosmosService.storeChatMessage(userMessage);
            // Get chat history
            const chatHistory = await this.cosmosService.getChatMessages(sessionId, { limit: 10 });
            const messages = chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            let fullResponse = '';
            const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Stream response
            await this.openAIService.createStreamingChatCompletion({ messages, maxTokens: 1000, temperature: 0.7 }, 
            // onChunk
            (chunk) => {
                fullResponse += chunk;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
            }, 
            // onComplete
            async (response) => {
                // Store complete AI response
                const assistantMessage = {
                    id: assistantMessageId,
                    sessionId,
                    userId,
                    content: fullResponse,
                    role: 'assistant',
                    timestamp: new Date(),
                    metadata: {
                        model: response.model,
                        usage: response.usage
                    }
                };
                await this.cosmosService.storeChatMessage(assistantMessage);
                res.write(`data: ${JSON.stringify({ type: 'complete', messageId: assistantMessageId })}\n\n`);
                res.end();
            }, 
            // onError
            (error) => {
                console.error('Streaming error:', error);
                res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`);
                res.end();
            });
        }
        catch (error) {
            console.error('Error in streamMessage:', error);
            res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to process message' })}\n\n`);
            res.end();
        }
    };
    /**
     * Get chat history for a session
     */
    getChatHistory = async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Session ID is required'
                });
                return;
            }
            const messages = await this.cosmosService.getChatMessages(sessionId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json({
                success: true,
                data: {
                    messages,
                    sessionId,
                    total: messages.length
                }
            });
        }
        catch (error) {
            console.error('Error in getChatHistory:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve chat history'
            });
        }
    };
    /**
     * Create a new chat session
     */
    createSession = async (req, res) => {
        try {
            const { userId, title, context } = req.body;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required'
                });
                return;
            }
            const session = {
                id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                title: title || 'New Chat Session',
                createdAt: new Date(),
                updatedAt: new Date(),
                messageCount: 0,
                isActive: true,
                metadata: context ? { context } : undefined
            };
            await this.cosmosService.createSession(session);
            res.json({
                success: true,
                data: session
            });
        }
        catch (error) {
            console.error('Error in createSession:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create session'
            });
        }
    };
    /**
     * Get user sessions
     */
    getUserSessions = async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required'
                });
                return;
            }
            const sessions = await this.cosmosService.getUserSessions(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            res.json({
                success: true,
                data: {
                    sessions,
                    userId,
                    total: sessions.length
                }
            });
        }
        catch (error) {
            console.error('Error in getUserSessions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve sessions'
            });
        }
    };
    /**
     * Update session
     */
    updateSession = async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { userId, updates } = req.body;
            if (!sessionId || !userId) {
                res.status(400).json({
                    success: false,
                    error: 'Session ID and User ID are required'
                });
                return;
            }
            const updatedSession = await this.cosmosService.updateSession(sessionId, userId, {
                ...updates,
                updatedAt: new Date()
            });
            res.json({
                success: true,
                data: updatedSession
            });
        }
        catch (error) {
            console.error('Error in updateSession:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update session'
            });
        }
    };
    /**
     * Delete session and its messages
     */
    deleteSession = async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { userId } = req.body;
            if (!sessionId || !userId) {
                res.status(400).json({
                    success: false,
                    error: 'Session ID and User ID are required'
                });
                return;
            }
            // Delete messages first
            await this.cosmosService.deleteChatMessages(sessionId);
            // Delete session
            await this.cosmosService.deleteSession(sessionId, userId);
            res.json({
                success: true,
                data: { sessionId, deleted: true }
            });
        }
        catch (error) {
            console.error('Error in deleteSession:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete session'
            });
        }
    };
    /**
     * Analyze deck using AI
     */
    analyzeDeck = async (req, res) => {
        try {
            const { deckList, format, analysisType } = req.body;
            if (!deckList) {
                res.status(400).json({
                    success: false,
                    error: 'Deck list is required'
                });
                return;
            }
            const analysis = await this.openAIService.analyzeDeck({
                deckList,
                format: format || 'standard',
                analysisType: analysisType || 'comprehensive'
            });
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            console.error('Error in analyzeDeck:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to analyze deck'
            });
        }
    };
}
//# sourceMappingURL=chat-controller.js.map