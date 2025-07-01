import { Request, Response } from 'express';
import { AzureOpenAIService } from '../services/azure-openai.js';
import { AzureCosmosService } from '../services/azure-cosmos.js';
import { ChatMessage, ChatSession, ApiResponse } from '../types/index.js';

export class ChatController {
  private openAIService: AzureOpenAIService;
  private cosmosService: AzureCosmosService;

  constructor() {
    this.openAIService = AzureOpenAIService.getInstance();
    this.cosmosService = AzureCosmosService.getInstance();
  }

  /**
   * Send a message and get AI response
   */
  public sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, sessionId, userId, context } = req.body;

      if (!message || !sessionId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: message, sessionId, userId'
        } as ApiResponse<null>);
        return;
      }

      // Store user message
      const userMessage: ChatMessage = {
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
      const assistantMessage: ChatMessage = {
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
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message'
      } as ApiResponse<null>);
    }
  };

  /**
   * Stream AI response in real-time
   */
  public streamMessage = async (req: Request, res: Response): Promise<void> => {
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
      const userMessage: ChatMessage = {
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
      await this.openAIService.createStreamingChatCompletion(
        { messages, maxTokens: 1000, temperature: 0.7 },
        // onChunk
        (chunk: string) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        },
        // onComplete
        async (response: any) => {
          // Store complete AI response
          const assistantMessage: ChatMessage = {
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
        (error: Error) => {
          console.error('Streaming error:', error);
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`);
          res.end();
        }
      );

    } catch (error) {
      console.error('Error in streamMessage:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to process message' })}\n\n`);
      res.end();
    }
  };

  /**
   * Get chat history for a session
   */
  public getChatHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required'
        } as ApiResponse<null>);
        return;
      }

      const messages = await this.cosmosService.getChatMessages(sessionId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: {
          messages,
          sessionId,
          total: messages.length
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in getChatHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chat history'
      } as ApiResponse<null>);
    }
  };

  /**
   * Create a new chat session
   */
  public createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, title, context } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        } as ApiResponse<null>);
        return;
      }

      const session: ChatSession = {
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
      } as ApiResponse<ChatSession>);

    } catch (error) {
      console.error('Error in createSession:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create session'
      } as ApiResponse<null>);
    }
  };

  /**
   * Get user sessions
   */
  public getUserSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        } as ApiResponse<null>);
        return;
      }

      const sessions = await this.cosmosService.getUserSessions(userId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: {
          sessions,
          userId,
          total: sessions.length
        }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in getUserSessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve sessions'
      } as ApiResponse<null>);
    }
  };

  /**
   * Update session
   */
  public updateSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { userId, updates } = req.body;

      if (!sessionId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Session ID and User ID are required'
        } as ApiResponse<null>);
        return;
      }

      const updatedSession = await this.cosmosService.updateSession(sessionId, userId, {
        ...updates,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        data: updatedSession
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in updateSession:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update session'
      } as ApiResponse<null>);
    }
  };

  /**
   * Delete session and its messages
   */
  public deleteSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.body;

      if (!sessionId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Session ID and User ID are required'
        } as ApiResponse<null>);
        return;
      }

      // Delete messages first
      await this.cosmosService.deleteChatMessages(sessionId);
      
      // Delete session
      await this.cosmosService.deleteSession(sessionId, userId);

      res.json({
        success: true,
        data: { sessionId, deleted: true }
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in deleteSession:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete session'
      } as ApiResponse<null>);
    }
  };

  /**
   * Analyze deck using AI
   */
  public analyzeDeck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckList, format, analysisType } = req.body;

      if (!deckList) {
        res.status(400).json({
          success: false,
          error: 'Deck list is required'
        } as ApiResponse<null>);
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
      } as ApiResponse<any>);

    } catch (error) {
      console.error('Error in analyzeDeck:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze deck'
      } as ApiResponse<null>);
    }
  };
}
