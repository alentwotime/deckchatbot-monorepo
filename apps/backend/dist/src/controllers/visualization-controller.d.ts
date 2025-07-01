import { Request, Response } from 'express';
export declare class VisualizationController {
    private visionService;
    private cosmosService;
    private storageService;
    private openAIService;
    constructor();
    /**
     * Generate deck blueprint visualization
     */
    generateDeckBlueprint: (req: Request, res: Response) => Promise<void>;
    /**
     * Create 3D deck model
     */
    create3DDeckModel: (req: Request, res: Response) => Promise<void>;
    /**
     * Process uploaded drawing for deck visualization
     */
    processUploadedDrawing: (req: Request, res: Response) => Promise<void>;
    /**
     * Generate deck statistics visualization
     */
    generateDeckStatisticsVisualization: (req: Request, res: Response) => Promise<void>;
    /**
     * Get visualization history for user
     */
    getVisualizationHistory: (req: Request, res: Response) => Promise<void>;
    /**
     * Delete visualization
     */
    deleteVisualization: (req: Request, res: Response) => Promise<void>;
    private calculateComprehensiveStatistics;
    private calculateManaCurve;
    private calculateColorDistribution;
    private calculateCardTypeDistribution;
    private calculateRarityDistribution;
    private calculateAverageCMC;
    private generateDrawingVisualization;
    private generateManaCurveVisualization;
    private generateColorDistributionVisualization;
    private generateCardTypeVisualization;
    private generateRarityVisualization;
    private generateComprehensiveVisualization;
}
//# sourceMappingURL=visualization-controller.d.ts.map