/**
 * Deck Blueprint Generator
 * Generates visual deck layouts, mana curve visualizations, card type distributions
 * and exports to PDF/PNG formats
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface Card {
  id: string;
  name: string;
  manaCost: number;
  type: string;
  subtype?: string;
  rarity: string;
  color: string[];
  quantity: number;
  imageUrl?: string;
}

export interface Deck {
  id: string;
  name: string;
  format: string;
  cards: Card[];
  commander?: Card;
  totalCards: number;
}

export interface LayoutOptions {
  width: number;
  height: number;
  theme: 'light' | 'dark' | 'classic';
  showImages: boolean;
  showManaCurve: boolean;
  showTypeDistribution: boolean;
  showColorDistribution: boolean;
  groupByType: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg';
  quality: number;
  includeMetadata: boolean;
  filename?: string;
}

export class DeckBlueprintGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private deck: Deck | null = null;
  private layoutOptions: LayoutOptions;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas || document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.layoutOptions = {
      width: 1200,
      height: 800,
      theme: 'light',
      showImages: true,
      showManaCurve: true,
      showTypeDistribution: true,
      showColorDistribution: true,
      groupByType: true
    };
  }

  /**
   * Set the deck to visualize
   */
  setDeck(deck: Deck): void {
    this.deck = deck;
  }

  /**
   * Update layout options
   */
  setLayoutOptions(options: Partial<LayoutOptions>): void {
    this.layoutOptions = { ...this.layoutOptions, ...options };
  }

  /**
   * Generate visual deck layout
   */
  async generateLayout(): Promise<HTMLElement> {
    if (!this.deck) {
      throw new Error('No deck set for visualization');
    }

    const container = document.createElement('div');
    container.className = `deck-blueprint ${this.layoutOptions.theme}`;
    container.style.width = `${this.layoutOptions.width}px`;
    container.style.height = `${this.layoutOptions.height}px`;
    container.style.padding = '20px';
    container.style.backgroundColor = this.getThemeColor('background');
    container.style.color = this.getThemeColor('text');
    container.style.fontFamily = 'Arial, sans-serif';

    // Header
    const header = this.createHeader();
    container.appendChild(header);

    // Main content area
    const mainContent = document.createElement('div');
    mainContent.style.display = 'flex';
    mainContent.style.gap = '20px';
    mainContent.style.height = 'calc(100% - 80px)';

    // Left column - Card list
    const cardList = this.createCardList();
    cardList.style.flex = '2';
    mainContent.appendChild(cardList);

    // Right column - Statistics
    const statsColumn = document.createElement('div');
    statsColumn.style.flex = '1';
    statsColumn.style.display = 'flex';
    statsColumn.style.flexDirection = 'column';
    statsColumn.style.gap = '15px';

    if (this.layoutOptions.showManaCurve) {
      const manaCurve = this.createManaCurveVisualization();
      statsColumn.appendChild(manaCurve);
    }

    if (this.layoutOptions.showTypeDistribution) {
      const typeDistribution = this.createTypeDistribution();
      statsColumn.appendChild(typeDistribution);
    }

    if (this.layoutOptions.showColorDistribution) {
      const colorDistribution = this.createColorDistribution();
      statsColumn.appendChild(colorDistribution);
    }

    mainContent.appendChild(statsColumn);
    container.appendChild(mainContent);

    return container;
  }

  /**
   * Create deck header with title and basic info
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.borderBottom = `2px solid ${this.getThemeColor('border')}`;
    header.style.paddingBottom = '15px';
    header.style.marginBottom = '20px';

    const title = document.createElement('h1');
    title.textContent = this.deck!.name;
    title.style.margin = '0';
    title.style.fontSize = '24px';
    title.style.color = this.getThemeColor('primary');

    const info = document.createElement('div');
    info.style.marginTop = '5px';
    info.style.fontSize = '14px';
    info.style.color = this.getThemeColor('secondary');
    info.textContent = `Format: ${this.deck!.format} | Total Cards: ${this.deck!.totalCards}`;

    header.appendChild(title);
    header.appendChild(info);

    return header;
  }

  /**
   * Create card list visualization
   */
  private createCardList(): HTMLElement {
    const container = document.createElement('div');
    container.style.border = `1px solid ${this.getThemeColor('border')}`;
    container.style.borderRadius = '8px';
    container.style.padding = '15px';
    container.style.backgroundColor = this.getThemeColor('surface');
    container.style.overflowY = 'auto';

    const title = document.createElement('h3');
    title.textContent = 'Deck List';
    title.style.margin = '0 0 15px 0';
    title.style.color = this.getThemeColor('primary');
    container.appendChild(title);

    const cards = this.layoutOptions.groupByType ? this.groupCardsByType() : [{ type: 'All Cards', cards: this.deck!.cards }];

    cards.forEach(group => {
      if (this.layoutOptions.groupByType && group.cards.length > 0) {
        const groupHeader = document.createElement('h4');
        groupHeader.textContent = `${group.type} (${group.cards.length})`;
        groupHeader.style.margin = '15px 0 10px 0';
        groupHeader.style.color = this.getThemeColor('secondary');
        groupHeader.style.fontSize = '16px';
        container.appendChild(groupHeader);
      }

      group.cards.forEach(card => {
        const cardElement = this.createCardElement(card);
        container.appendChild(cardElement);
      });
    });

    return container;
  }

  /**
   * Create individual card element
   */
  private createCardElement(card: Card): HTMLElement {
    const cardDiv = document.createElement('div');
    cardDiv.style.display = 'flex';
    cardDiv.style.alignItems = 'center';
    cardDiv.style.padding = '8px';
    cardDiv.style.marginBottom = '4px';
    cardDiv.style.borderRadius = '4px';
    cardDiv.style.backgroundColor = this.getThemeColor('cardBackground');
    cardDiv.style.border = `1px solid ${this.getThemeColor('cardBorder')}`;

    // Quantity
    const quantity = document.createElement('span');
    quantity.textContent = `${card.quantity}x`;
    quantity.style.fontWeight = 'bold';
    quantity.style.minWidth = '30px';
    quantity.style.color = this.getThemeColor('primary');

    // Mana cost
    const manaCost = document.createElement('span');
    manaCost.textContent = `{${card.manaCost}}`;
    manaCost.style.minWidth = '40px';
    manaCost.style.textAlign = 'center';
    manaCost.style.backgroundColor = this.getThemeColor('manaCost');
    manaCost.style.borderRadius = '12px';
    manaCost.style.padding = '2px 6px';
    manaCost.style.fontSize = '12px';
    manaCost.style.marginLeft = '8px';

    // Card name
    const name = document.createElement('span');
    name.textContent = card.name;
    name.style.flex = '1';
    name.style.marginLeft = '12px';
    name.style.fontWeight = '500';

    // Rarity indicator
    const rarity = document.createElement('span');
    rarity.textContent = card.rarity.charAt(0).toUpperCase();
    rarity.style.width = '20px';
    rarity.style.height = '20px';
    rarity.style.borderRadius = '50%';
    rarity.style.backgroundColor = this.getRarityColor(card.rarity);
    rarity.style.color = 'white';
    rarity.style.textAlign = 'center';
    rarity.style.fontSize = '12px';
    rarity.style.lineHeight = '20px';
    rarity.style.fontWeight = 'bold';

    cardDiv.appendChild(quantity);
    cardDiv.appendChild(manaCost);
    cardDiv.appendChild(name);
    cardDiv.appendChild(rarity);

    return cardDiv;
  }

  /**
   * Create mana curve visualization
   */
  private createManaCurveVisualization(): HTMLElement {
    const container = document.createElement('div');
    container.style.border = `1px solid ${this.getThemeColor('border')}`;
    container.style.borderRadius = '8px';
    container.style.padding = '15px';
    container.style.backgroundColor = this.getThemeColor('surface');

    const title = document.createElement('h3');
    title.textContent = 'Mana Curve';
    title.style.margin = '0 0 15px 0';
    title.style.color = this.getThemeColor('primary');
    container.appendChild(title);

    const manaCurve = this.calculateManaCurve();
    const maxCount = Math.max(...Object.values(manaCurve));

    const chartContainer = document.createElement('div');
    chartContainer.style.display = 'flex';
    chartContainer.style.alignItems = 'end';
    chartContainer.style.height = '120px';
    chartContainer.style.gap = '4px';

    for (let i = 0; i <= 7; i++) {
      const barContainer = document.createElement('div');
      barContainer.style.flex = '1';
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.alignItems = 'center';

      const count = manaCurve[i] || 0;
      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

      const bar = document.createElement('div');
      bar.style.width = '100%';
      bar.style.height = `${height}px`;
      bar.style.backgroundColor = this.getThemeColor('primary');
      bar.style.borderRadius = '2px 2px 0 0';
      bar.style.marginBottom = '5px';

      const label = document.createElement('span');
      label.textContent = i === 7 ? '7+' : i.toString();
      label.style.fontSize = '12px';
      label.style.color = this.getThemeColor('secondary');

      const countLabel = document.createElement('span');
      countLabel.textContent = count.toString();
      countLabel.style.fontSize = '10px';
      countLabel.style.color = this.getThemeColor('text');
      countLabel.style.marginBottom = '2px';

      barContainer.appendChild(countLabel);
      barContainer.appendChild(bar);
      barContainer.appendChild(label);
      chartContainer.appendChild(barContainer);
    }

    container.appendChild(chartContainer);
    return container;
  }

  /**
   * Create type distribution chart
   */
  private createTypeDistribution(): HTMLElement {
    const container = document.createElement('div');
    container.style.border = `1px solid ${this.getThemeColor('border')}`;
    container.style.borderRadius = '8px';
    container.style.padding = '15px';
    container.style.backgroundColor = this.getThemeColor('surface');

    const title = document.createElement('h3');
    title.textContent = 'Card Types';
    title.style.margin = '0 0 15px 0';
    title.style.color = this.getThemeColor('primary');
    container.appendChild(title);

    const typeDistribution = this.calculateTypeDistribution();

    Object.entries(typeDistribution).forEach(([type, count]) => {
      const typeRow = document.createElement('div');
      typeRow.style.display = 'flex';
      typeRow.style.justifyContent = 'space-between';
      typeRow.style.alignItems = 'center';
      typeRow.style.marginBottom = '8px';
      typeRow.style.padding = '4px 0';

      const typeName = document.createElement('span');
      typeName.textContent = type;
      typeName.style.color = this.getThemeColor('text');

      const typeCount = document.createElement('span');
      typeCount.textContent = count.toString();
      typeCount.style.fontWeight = 'bold';
      typeCount.style.color = this.getThemeColor('primary');

      typeRow.appendChild(typeName);
      typeRow.appendChild(typeCount);
      container.appendChild(typeRow);
    });

    return container;
  }

  /**
   * Create color distribution chart
   */
  private createColorDistribution(): HTMLElement {
    const container = document.createElement('div');
    container.style.border = `1px solid ${this.getThemeColor('border')}`;
    container.style.borderRadius = '8px';
    container.style.padding = '15px';
    container.style.backgroundColor = this.getThemeColor('surface');

    const title = document.createElement('h3');
    title.textContent = 'Color Distribution';
    title.style.margin = '0 0 15px 0';
    title.style.color = this.getThemeColor('primary');
    container.appendChild(title);

    const colorDistribution = this.calculateColorDistribution();
    const colorMap = {
      'W': { name: 'White', color: '#FFFBD5' },
      'U': { name: 'Blue', color: '#0E68AB' },
      'B': { name: 'Black', color: '#150B00' },
      'R': { name: 'Red', color: '#D3202A' },
      'G': { name: 'Green', color: '#00733E' },
      'C': { name: 'Colorless', color: '#CCCCCC' }
    };

    Object.entries(colorDistribution).forEach(([color, count]) => {
      if (count > 0) {
        const colorRow = document.createElement('div');
        colorRow.style.display = 'flex';
        colorRow.style.alignItems = 'center';
        colorRow.style.marginBottom = '8px';
        colorRow.style.padding = '4px 0';

        const colorIndicator = document.createElement('div');
        colorIndicator.style.width = '16px';
        colorIndicator.style.height = '16px';
        colorIndicator.style.borderRadius = '50%';
        colorIndicator.style.backgroundColor = colorMap[color as keyof typeof colorMap]?.color || '#CCCCCC';
        colorIndicator.style.marginRight = '8px';
        colorIndicator.style.border = '1px solid #333';

        const colorName = document.createElement('span');
        colorName.textContent = colorMap[color as keyof typeof colorMap]?.name || color;
        colorName.style.flex = '1';
        colorName.style.color = this.getThemeColor('text');

        const colorCount = document.createElement('span');
        colorCount.textContent = count.toString();
        colorCount.style.fontWeight = 'bold';
        colorCount.style.color = this.getThemeColor('primary');

        colorRow.appendChild(colorIndicator);
        colorRow.appendChild(colorName);
        colorRow.appendChild(colorCount);
        container.appendChild(colorRow);
      }
    });

    return container;
  }

  /**
   * Export deck blueprint to specified format
   */
  async exportBlueprint(options: ExportOptions): Promise<Blob> {
    const layout = await this.generateLayout();
    document.body.appendChild(layout);

    try {
      if (options.format === 'pdf') {
        return await this.exportToPDF(layout, options);
      } else {
        return await this.exportToImage(layout, options);
      }
    } finally {
      document.body.removeChild(layout);
    }
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(element: HTMLElement, options: ExportOptions): Promise<Blob> {
    const canvas = await html2canvas(element, {
      scale: options.quality || 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

    if (options.includeMetadata && this.deck) {
      pdf.setProperties({
        title: `${this.deck.name} - Deck Blueprint`,
        subject: 'Magic: The Gathering Deck Visualization',
        author: 'Deck Blueprint Generator',
        creator: 'DeckChatBot'
      });
    }

    return new Promise((resolve) => {
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    });
  }

  /**
   * Export to image format
   */
  private async exportToImage(element: HTMLElement, options: ExportOptions): Promise<Blob> {
    const canvas = await html2canvas(element, {
      scale: options.quality || 2,
      useCORS: true,
      allowTaint: true
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, `image/${options.format}`, options.quality || 0.9);
    });
  }

  /**
   * Helper methods for calculations
   */
  private calculateManaCurve(): Record<number, number> {
    const curve: Record<number, number> = {};
    
    this.deck!.cards.forEach(card => {
      const cost = Math.min(card.manaCost, 7);
      curve[cost] = (curve[cost] || 0) + card.quantity;
    });

    return curve;
  }

  private calculateTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.deck!.cards.forEach(card => {
      distribution[card.type] = (distribution[card.type] || 0) + card.quantity;
    });

    return distribution;
  }

  private calculateColorDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.deck!.cards.forEach(card => {
      card.color.forEach(color => {
        distribution[color] = (distribution[color] || 0) + card.quantity;
      });
    });

    return distribution;
  }

  private groupCardsByType(): Array<{ type: string; cards: Card[] }> {
    const groups: Record<string, Card[]> = {};
    
    this.deck!.cards.forEach(card => {
      if (!groups[card.type]) {
        groups[card.type] = [];
      }
      groups[card.type].push(card);
    });

    return Object.entries(groups).map(([type, cards]) => ({ type, cards }));
  }

  private getThemeColor(element: string): string {
    const themes = {
      light: {
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        primary: '#0d6efd',
        secondary: '#6c757d',
        border: '#dee2e6',
        cardBackground: '#ffffff',
        cardBorder: '#e9ecef',
        manaCost: '#e9ecef'
      },
      dark: {
        background: '#1a1a1a',
        surface: '#2d2d2d',
        text: '#ffffff',
        primary: '#4dabf7',
        secondary: '#adb5bd',
        border: '#495057',
        cardBackground: '#343a40',
        cardBorder: '#495057',
        manaCost: '#495057'
      },
      classic: {
        background: '#f5f5dc',
        surface: '#faf0e6',
        text: '#8b4513',
        primary: '#b8860b',
        secondary: '#a0522d',
        border: '#daa520',
        cardBackground: '#fff8dc',
        cardBorder: '#daa520',
        manaCost: '#f0e68c'
      }
    };

    return themes[this.layoutOptions.theme][element as keyof typeof themes.light] || '#000000';
  }

  private getRarityColor(rarity: string): string {
    const colors = {
      common: '#1e1e1e',
      uncommon: '#c0c0c0',
      rare: '#ffd700',
      mythic: '#ff8c00',
      legendary: '#ff4500'
    };

    return colors[rarity.toLowerCase() as keyof typeof colors] || '#1e1e1e';
  }
}

export default DeckBlueprintGenerator;
