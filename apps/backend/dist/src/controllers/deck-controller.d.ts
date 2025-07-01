import { Request, Response } from 'express';
export declare class DeckController {
    private cosmosService;
    private storageService;
    private visionService;
    private openAIService;
    constructor();
    /**
     * Save a deck
     */
    saveDeck: (req: Request, res: Response) => Promise<void>;
    /**
     * Retrieve a deck by ID
     */
    getDeck: (req: Request, res: Response) => Promise<void>;
    /**
     * Search and filter decks
     */
    searchDecks: (req: Request, res: Response) => Promise<void>;
    /**
     * Update a deck
     */
    updateDeck: (req: Request, res: Response) => Promise<void>;
    /**
     * Delete a deck
     */
    deleteDeck: (req: Request, res: Response) => Promise<void>;
    /**
     * Export deck in various formats
     */
    exportDeck: (req: Request, res: Response) => Promise<void>;
    /**
     * Import deck from file
     */
    importDeck: (req: Request, res: Response) => Promise<void>;
    /**
     * Get deck statistics
     */
    getDeckStatistics: (req: Request, res: Response) => Promise<void>;
    /**
     * NEW: Generate deck blueprint
     */
    generateDeckBlueprint: (req: Request, res: Response) => Promise<void>;
    /**
     * NEW: Create 3D deck model
     */
    create3DDeckModel: (req: Request, res: Response) => Promise<void>;
    /**
     * Get popular decks
     */
    getPopularDecks: (req: Request, res: Response) => Promise<void>;
    private calculateDeckStatistics;
    private calculateManaCurve;
    private calculateAverageCMC;
    private extractColors;
    private calculateColorDistribution;
    private calculateCardTypeDistribution;
    private calculateRarityDistribution;
}
//# sourceMappingURL=deck-controller.d.ts.map