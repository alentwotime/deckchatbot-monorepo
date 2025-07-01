import { Request, Response } from 'express';
export declare class ChatController {
    private openAIService;
    private cosmosService;
    constructor();
    /**
     * Send a message and get AI response
     */
    sendMessage: (req: Request, res: Response) => Promise<void>;
    /**
     * Stream AI response in real-time
     */
    streamMessage: (req: Request, res: Response) => Promise<void>;
    /**
     * Get chat history for a session
     */
    getChatHistory: (req: Request, res: Response) => Promise<void>;
    /**
     * Create a new chat session
     */
    createSession: (req: Request, res: Response) => Promise<void>;
    /**
     * Get user sessions
     */
    getUserSessions: (req: Request, res: Response) => Promise<void>;
    /**
     * Update session
     */
    updateSession: (req: Request, res: Response) => Promise<void>;
    /**
     * Delete session and its messages
     */
    deleteSession: (req: Request, res: Response) => Promise<void>;
    /**
     * Analyze deck using AI
     */
    analyzeDeck: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=chat-controller.d.ts.map