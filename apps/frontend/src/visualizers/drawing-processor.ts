/**
 * Drawing Analysis Processor
 * Hand-drawn deck list recognition, sketch to digital conversion
 * Card name extraction from drawings and layout analysis
 */

import Tesseract from 'tesseract.js';

export interface DrawingInput {
  imageData: ImageData | HTMLCanvasElement | HTMLImageElement | File;
  type: 'canvas' | 'image' | 'file';
  preprocessingOptions?: PreprocessingOptions;
}

export interface PreprocessingOptions {
  contrast: number;
  brightness: number;
  threshold: number;
  blur: number;
  denoise: boolean;
  deskew: boolean;
  removeBackground: boolean;
}

export interface RecognizedCard {
  name: string;
  quantity: number;
  confidence: number;
  boundingBox: BoundingBox;
  rawText: string;
  suggestedCorrections?: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutRegion {
  type: 'header' | 'cardList' | 'footer' | 'annotation' | 'unknown';
  boundingBox: BoundingBox;
  confidence: number;
  content: string;
}

export interface DrawingAnalysisResult {
  recognizedCards: RecognizedCard[];
  layoutRegions: LayoutRegion[];
  totalCards: number;
  confidence: number;
  processingTime: number;
  suggestions: string[];
  errors: string[];
}

export interface OCROptions {
  language: string;
  engineMode: number;
  pageSegMode: number;
  whitelist?: string;
  blacklist?: string;
}

export interface CardDatabase {
  searchCard(name: string): Promise<CardMatch[]>;
  fuzzySearch(name: string, threshold?: number): Promise<CardMatch[]>;
}

export interface CardMatch {
  name: string;
  similarity: number;
  metadata?: {
    set?: string;
    rarity?: string;
    type?: string;
    manaCost?: number;
  };
}

export class DrawingProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cardDatabase: CardDatabase | null = null;
  private ocrOptions: OCROptions;
  private preprocessingOptions: PreprocessingOptions;

  constructor(cardDatabase?: CardDatabase) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.cardDatabase = cardDatabase || null;

    // Default OCR options
    this.ocrOptions = {
      language: 'eng',
      engineMode: 1, // LSTM only
      pageSegMode: 6, // Uniform block of text
      whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \'-,.'
    };

    // Default preprocessing options
    this.preprocessingOptions = {
      contrast: 1.2,
      brightness: 1.1,
      threshold: 128,
      blur: 0,
      denoise: true,
      deskew: true,
      removeBackground: false
    };
  }

  /**
   * Set card database for name validation and correction
   */
  setCardDatabase(database: CardDatabase): void {
    this.cardDatabase = database;
  }

  /**
   * Update OCR options
   */
  setOCROptions(options: Partial<OCROptions>): void {
    this.ocrOptions = { ...this.ocrOptions, ...options };
  }

  /**
   * Update preprocessing options
   */
  setPreprocessingOptions(options: Partial<PreprocessingOptions>): void {
    this.preprocessingOptions = { ...this.preprocessingOptions, ...options };
  }

  /**
   * Process drawing and extract deck list
   */
  async processDrawing(input: DrawingInput): Promise<DrawingAnalysisResult> {
    const startTime = Date.now();
    const result: DrawingAnalysisResult = {
      recognizedCards: [],
      layoutRegions: [],
      totalCards: 0,
      confidence: 0,
      processingTime: 0,
      suggestions: [],
      errors: []
    };

    try {
      // Load and preprocess image
      const processedImage = await this.preprocessImage(input);
      
      // Analyze layout
      const layoutRegions = await this.analyzeLayout(processedImage);
      result.layoutRegions = layoutRegions;

      // Extract text using OCR
      const ocrResult = await this.performOCR(processedImage);
      
      // Parse deck list from OCR text
      const recognizedCards = await this.parseDeckList(ocrResult, layoutRegions);
      result.recognizedCards = recognizedCards;

      // Calculate statistics
      result.totalCards = recognizedCards.reduce((sum, card) => sum + card.quantity, 0);
      result.confidence = this.calculateOverallConfidence(recognizedCards, layoutRegions);
      
      // Generate suggestions
      result.suggestions = await this.generateSuggestions(recognizedCards);

      // Validate results
      result.errors = this.validateResults(recognizedCards);

    } catch (error) {
      result.errors.push(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Preprocess image for better OCR results
   */
  private async preprocessImage(input: DrawingInput): Promise<HTMLCanvasElement> {
    let sourceCanvas: HTMLCanvasElement;

    // Convert input to canvas
    if (input.type === 'canvas') {
      sourceCanvas = input.imageData as HTMLCanvasElement;
    } else if (input.type === 'image') {
      sourceCanvas = await this.imageToCanvas(input.imageData as HTMLImageElement);
    } else if (input.type === 'file') {
      sourceCanvas = await this.fileToCanvas(input.imageData as File);
    } else {
      throw new Error('Unsupported input type');
    }

    // Apply preprocessing
    const options = { ...this.preprocessingOptions, ...input.preprocessingOptions };
    return this.applyPreprocessing(sourceCanvas, options);
  }

  /**
   * Convert image to canvas
   */
  private async imageToCanvas(image: HTMLImageElement): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    return canvas;
  }

  /**
   * Convert file to canvas
   */
  private async fileToCanvas(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = await this.imageToCanvas(img);
            resolve(canvas);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Apply preprocessing filters to improve OCR accuracy
   */
  private applyPreprocessing(sourceCanvas: HTMLCanvasElement, options: PreprocessingOptions): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    
    // Draw original image
    ctx.drawImage(sourceCanvas, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply filters
    if (options.removeBackground) {
      this.removeBackground(data);
    }

    if (options.denoise) {
      this.applyDenoising(data, canvas.width, canvas.height);
    }

    // Adjust brightness and contrast
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] = Math.min(255, data[i] * options.brightness);
      data[i + 1] = Math.min(255, data[i + 1] * options.brightness);
      data[i + 2] = Math.min(255, data[i + 2] * options.brightness);

      // Apply contrast
      data[i] = Math.min(255, (data[i] - 128) * options.contrast + 128);
      data[i + 1] = Math.min(255, (data[i + 1] - 128) * options.contrast + 128);
      data[i + 2] = Math.min(255, (data[i + 2] - 128) * options.contrast + 128);

      // Apply threshold (convert to binary)
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const binary = gray > options.threshold ? 255 : 0;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    }

    // Apply blur if specified
    if (options.blur > 0) {
      this.applyGaussianBlur(data, canvas.width, canvas.height, options.blur);
    }

    // Put processed image data back
    ctx.putImageData(imageData, 0, 0);

    // Apply deskewing if enabled
    if (options.deskew) {
      return this.deskewImage(canvas);
    }

    return canvas;
  }

  /**
   * Remove background using simple thresholding
   */
  private removeBackground(data: Uint8ClampedArray): void {
    // Simple background removal - convert light colors to white
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 200) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    }
  }

  /**
   * Apply simple denoising filter
   */
  private applyDenoising(data: Uint8ClampedArray, width: number, height: number): void {
    const original = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Apply median filter for each channel
        for (let c = 0; c < 3; c++) {
          const neighbors = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4 + c;
              neighbors.push(original[nIdx]);
            }
          }
          neighbors.sort((a, b) => a - b);
          data[idx + c] = neighbors[4]; // median value
        }
      }
    }
  }

  /**
   * Apply Gaussian blur
   */
  private applyGaussianBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
    // Simple box blur approximation
    const original = new Uint8ClampedArray(data);
    const size = Math.ceil(radius);
    
    for (let y = size; y < height - size; y++) {
      for (let x = size; x < width - size; x++) {
        const idx = (y * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let count = 0;
          
          for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4 + c;
              sum += original[nIdx];
              count++;
            }
          }
          
          data[idx + c] = sum / count;
        }
      }
    }
  }

  /**
   * Deskew image to correct rotation
   */
  private deskewImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
    // Simple deskewing - detect dominant lines and rotate accordingly
    const angle = this.detectSkewAngle(canvas);
    
    if (Math.abs(angle) > 0.5) { // Only correct if angle is significant
      return this.rotateCanvas(canvas, -angle);
    }
    
    return canvas;
  }

  /**
   * Detect skew angle using Hough transform approximation
   */
  private detectSkewAngle(canvas: HTMLCanvasElement): number {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple line detection - count horizontal line segments at different angles
    const angles = [];
    for (let angle = -10; angle <= 10; angle += 0.5) {
      const score = this.scoreAngle(data, canvas.width, canvas.height, angle);
      angles.push({ angle, score });
    }
    
    // Find angle with highest score
    angles.sort((a, b) => b.score - a.score);
    return angles[0].angle;
  }

  /**
   * Score an angle based on horizontal line detection
   */
  private scoreAngle(data: Uint8ClampedArray, width: number, height: number, angle: number): number {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let score = 0;
    
    // Sample horizontal lines and check for text alignment
    for (let y = height * 0.2; y < height * 0.8; y += 10) {
      let lineScore = 0;
      let prevPixel = 0;
      
      for (let x = 0; x < width; x++) {
        const rotatedY = Math.round(y * cos - x * sin);
        const rotatedX = Math.round(y * sin + x * cos);
        
        if (rotatedY >= 0 && rotatedY < height && rotatedX >= 0 && rotatedX < width) {
          const idx = (rotatedY * width + rotatedX) * 4;
          const pixel = data[idx]; // Red channel (grayscale)
          
          // Count transitions (text edges)
          if (Math.abs(pixel - prevPixel) > 50) {
            lineScore++;
          }
          prevPixel = pixel;
        }
      }
      
      score += lineScore;
    }
    
    return score;
  }

  /**
   * Rotate canvas by specified angle
   */
  private rotateCanvas(canvas: HTMLCanvasElement, angle: number): HTMLCanvasElement {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    
    const newWidth = Math.ceil(canvas.width * cos + canvas.height * sin);
    const newHeight = Math.ceil(canvas.width * sin + canvas.height * cos);
    
    const rotatedCanvas = document.createElement('canvas');
    const ctx = rotatedCanvas.getContext('2d')!;
    
    rotatedCanvas.width = newWidth;
    rotatedCanvas.height = newHeight;
    
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    return rotatedCanvas;
  }

  /**
   * Analyze layout to identify different regions
   */
  private async analyzeLayout(canvas: HTMLCanvasElement): Promise<LayoutRegion[]> {
    const regions: LayoutRegion[] = [];
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Detect text blocks using connected component analysis
    const textBlocks = this.detectTextBlocks(imageData);
    
    // Classify regions based on position and characteristics
    textBlocks.forEach(block => {
      const region: LayoutRegion = {
        type: this.classifyRegion(block, canvas.width, canvas.height),
        boundingBox: block,
        confidence: 0.8, // Default confidence
        content: '' // Will be filled by OCR
      };
      regions.push(region);
    });
    
    return regions;
  }

  /**
   * Detect text blocks using simple connected component analysis
   */
  private detectTextBlocks(imageData: ImageData): BoundingBox[] {
    const { width, height, data } = imageData;
    const visited = new Array(width * height).fill(false);
    const blocks: BoundingBox[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!visited[idx] && this.isTextPixel(data, idx * 4)) {
          const block = this.floodFill(data, visited, x, y, width, height);
          if (block.width > 10 && block.height > 5) { // Filter small noise
            blocks.push(block);
          }
        }
      }
    }
    
    return blocks;
  }

  /**
   * Check if pixel is likely part of text
   */
  private isTextPixel(data: Uint8ClampedArray, idx: number): boolean {
    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    return brightness < 128; // Dark pixels are likely text
  }

  /**
   * Flood fill to find connected text regions
   */
  private floodFill(data: Uint8ClampedArray, visited: boolean[], startX: number, startY: number, width: number, height: number): BoundingBox {
    const stack = [{ x: startX, y: startY }];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || !this.isTextPixel(data, idx * 4)) {
        continue;
      }
      
      visited[idx] = true;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Add neighbors
      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Classify region type based on position and characteristics
   */
  private classifyRegion(block: BoundingBox, canvasWidth: number, canvasHeight: number): LayoutRegion['type'] {
    const relativeY = block.y / canvasHeight;
    const relativeHeight = block.height / canvasHeight;
    
    if (relativeY < 0.2) {
      return 'header';
    } else if (relativeY > 0.8) {
      return 'footer';
    } else if (relativeHeight < 0.05) {
      return 'annotation';
    } else {
      return 'cardList';
    }
  }

  /**
   * Perform OCR on preprocessed image
   */
  private async performOCR(canvas: HTMLCanvasElement): Promise<Tesseract.RecognizeResult> {
    const worker = await Tesseract.createWorker();
    
    try {
      await worker.loadLanguage(this.ocrOptions.language);
      await worker.initialize(this.ocrOptions.language);
      
      await worker.setParameters({
        tessedit_ocr_engine_mode: this.ocrOptions.engineMode,
        tessedit_pageseg_mode: this.ocrOptions.pageSegMode,
        tessedit_char_whitelist: this.ocrOptions.whitelist,
        tessedit_char_blacklist: this.ocrOptions.blacklist
      });
      
      const result = await worker.recognize(canvas);
      return result;
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Parse deck list from OCR text
   */
  private async parseDeckList(ocrResult: Tesseract.RecognizeResult, layoutRegions: LayoutRegion[]): Promise<RecognizedCard[]> {
    const cards: RecognizedCard[] = [];
    const lines = ocrResult.data.text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) continue;
      
      const cardMatch = this.parseCardLine(trimmedLine);
      if (cardMatch) {
        // Find corresponding OCR word data for confidence and bounding box
        const wordData = this.findWordData(ocrResult.data.words, cardMatch.name);
        
        const recognizedCard: RecognizedCard = {
          name: cardMatch.name,
          quantity: cardMatch.quantity,
          confidence: wordData ? wordData.confidence / 100 : 0.5,
          boundingBox: wordData ? wordData.bbox : { x: 0, y: 0, width: 0, height: 0 },
          rawText: trimmedLine
        };
        
        // Add suggested corrections if card database is available
        if (this.cardDatabase) {
          recognizedCard.suggestedCorrections = await this.getSuggestedCorrections(cardMatch.name);
        }
        
        cards.push(recognizedCard);
      }
    }
    
    return cards;
  }

  /**
   * Parse individual card line (e.g., "4x Lightning Bolt" or "1 Counterspell")
   */
  private parseCardLine(line: string): { name: string; quantity: number } | null {
    // Common patterns for deck lists
    const patterns = [
      /^(\d+)x?\s+(.+)$/i,           // "4x Lightning Bolt" or "4 Lightning Bolt"
      /^(\d+)\s*[-–]\s*(.+)$/i,     // "4 - Lightning Bolt"
      /^(.+?)\s*[x×]\s*(\d+)$/i,    // "Lightning Bolt x4"
      /^(.+?)\s*\((\d+)\)$/i        // "Lightning Bolt (4)"
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const quantity = parseInt(match[1]);
        const name = match[2].trim();
        
        if (quantity > 0 && quantity <= 20 && name.length > 2) { // Reasonable constraints
          return { name, quantity };
        }
      }
    }
    
    // Try parsing without quantity (assume 1)
    if (line.length > 2 && /^[A-Za-z]/.test(line)) {
      return { name: line, quantity: 1 };
    }
    
    return null;
  }

  /**
   * Find word data from OCR results
   */
  private findWordData(words: Tesseract.Word[], cardName: string): Tesseract.Word | null {
    const nameWords = cardName.toLowerCase().split(' ');
    
    for (const word of words) {
      if (nameWords.some(nameWord => word.text.toLowerCase().includes(nameWord))) {
        return word;
      }
    }
    
    return null;
  }

  /**
   * Get suggested corrections from card database
   */
  private async getSuggestedCorrections(cardName: string): Promise<string[]> {
    if (!this.cardDatabase) return [];
    
    try {
      const matches = await this.cardDatabase.fuzzySearch(cardName, 0.7);
      return matches.slice(0, 3).map(match => match.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(cards: RecognizedCard[], regions: LayoutRegion[]): number {
    if (cards.length === 0) return 0;
    
    const cardConfidence = cards.reduce((sum, card) => sum + card.confidence, 0) / cards.length;
    const layoutConfidence = regions.reduce((sum, region) => sum + region.confidence, 0) / regions.length;
    
    return (cardConfidence + layoutConfidence) / 2;
  }

  /**
   * Generate suggestions for improving recognition
   */
  private async generateSuggestions(cards: RecognizedCard[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (cards.length === 0) {
      suggestions.push('No cards were recognized. Try improving image quality or contrast.');
    }
    
    const lowConfidenceCards = cards.filter(card => card.confidence < 0.6);
    if (lowConfidenceCards.length > 0) {
      suggestions.push(`${lowConfidenceCards.length} cards have low confidence. Consider manual review.`);
    }
    
    const totalQuantity = cards.reduce((sum, card) => sum + card.quantity, 0);
    if (totalQuantity < 40) {
      suggestions.push('Deck appears incomplete. Standard decks typically have 60+ cards.');
    } else if (totalQuantity > 100) {
      suggestions.push('Unusually high card count detected. Please verify quantities.');
    }
    
    return suggestions;
  }

  /**
   * Validate recognition results
   */
  private validateResults(cards: RecognizedCard[]): string[] {
    const errors: string[] = [];
    
    // Check for duplicate card names
    const cardNames = new Set();
    const duplicates = new Set();
    
    cards.forEach(card => {
      if (cardNames.has(card.name.toLowerCase())) {
        duplicates.add(card.name);
      }
      cardNames.add(card.name.toLowerCase());
    });
    
    if (duplicates.size > 0) {
      errors.push(`Duplicate cards detected: ${Array.from(duplicates).join(', ')}`);
    }
    
    // Check for unreasonable quantities
    const highQuantityCards = cards.filter(card => card.quantity > 4);
    if (highQuantityCards.length > 0) {
      errors.push(`Cards with high quantities (>4): ${highQuantityCards.map(c => c.name).join(', ')}`);
    }
    
    return errors;
  }

  /**
   * Export processed image for debugging
   */
  exportProcessedImage(canvas: HTMLCanvasElement, format: 'png' | 'jpeg' = 'png'): string {
    return canvas.toDataURL(`image/${format}`);
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(result: DrawingAnalysisResult): Record<string, any> {
    return {
      totalCards: result.totalCards,
      recognizedCards: result.recognizedCards.length,
      averageConfidence: result.confidence,
      processingTime: result.processingTime,
      layoutRegions: result.layoutRegions.length,
      errorCount: result.errors.length,
      suggestionCount: result.suggestions.length
    };
  }
}

export default DrawingProcessor;
