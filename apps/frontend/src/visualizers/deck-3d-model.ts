/**
 * 3D Deck Model Creator
 * Three.js integration for 3D deck visualization
 * Interactive card positioning and 3D model export
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';

export interface Card3D {
  id: string;
  name: string;
  manaCost: number;
  type: string;
  color: string[];
  quantity: number;
  imageUrl?: string;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}

export interface Deck3D {
  id: string;
  name: string;
  cards: Card3D[];
  commander?: Card3D;
}

export interface Scene3DOptions {
  width: number;
  height: number;
  backgroundColor: number;
  enableShadows: boolean;
  enableAntialiasing: boolean;
  cameraPosition: THREE.Vector3;
  lightIntensity: number;
  ambientLightIntensity: number;
}

export interface LayoutMode {
  type: 'grid' | 'spiral' | 'stack' | 'curve' | 'custom';
  spacing: number;
  groupByType: boolean;
  groupByColor: boolean;
  animationDuration: number;
}

export interface ExportOptions3D {
  format: 'gltf' | 'obj' | 'stl' | 'ply';
  includeTextures: boolean;
  includeAnimations: boolean;
  scale: number;
  filename?: string;
}

export interface InteractionOptions {
  enableOrbitControls: boolean;
  enableCardSelection: boolean;
  enableDragAndDrop: boolean;
  enableZoom: boolean;
  enableRotation: boolean;
  hoverEffects: boolean;
}

export class Deck3DModelCreator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;
  private deck: Deck3D | null = null;
  private cardMeshes: Map<string, THREE.Mesh> = new Map();
  private selectedCard: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement | null = null;
  private options: Scene3DOptions;
  private layoutMode: LayoutMode;
  private interactionOptions: InteractionOptions;
  private animationMixer: THREE.AnimationMixer | null = null;
  private clock: THREE.Clock;

  constructor(container?: HTMLElement) {
    this.container = container || null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    // Default options
    this.options = {
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a1a,
      enableShadows: true,
      enableAntialiasing: true,
      cameraPosition: new THREE.Vector3(0, 10, 20),
      lightIntensity: 1.0,
      ambientLightIntensity: 0.4
    };

    this.layoutMode = {
      type: 'grid',
      spacing: 2.5,
      groupByType: false,
      groupByColor: false,
      animationDuration: 1000
    };

    this.interactionOptions = {
      enableOrbitControls: true,
      enableCardSelection: true,
      enableDragAndDrop: true,
      enableZoom: true,
      enableRotation: true,
      hoverEffects: true
    };

    this.initializeScene();
  }

  /**
   * Initialize the 3D scene
   */
  private initializeScene(): void {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.options.width / this.options.height,
      0.1,
      1000
    );
    this.camera.position.copy(this.options.cameraPosition);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.enableAntialiasing,
      alpha: true
    });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.shadowMap.enabled = this.options.enableShadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    this.setupLighting();

    // Controls
    if (this.interactionOptions.enableOrbitControls) {
      this.setupControls();
    }

    // Event listeners
    this.setupEventListeners();

    // Animation loop
    this.animate();
  }

  /**
   * Setup lighting for the scene
   */
  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, this.options.ambientLightIntensity);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, this.options.lightIntensity);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = this.options.enableShadows;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    // Point lights for better card illumination
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight1.position.set(-10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight2.position.set(10, 10, -10);
    this.scene.add(pointLight2);
  }

  /**
   * Setup orbit controls
   */
  private setupControls(): void {
    if (!this.renderer.domElement) return;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = this.interactionOptions.enableZoom;
    this.controls.enableRotate = this.interactionOptions.enableRotation;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  /**
   * Setup event listeners for interaction
   */
  private setupEventListeners(): void {
    if (!this.renderer.domElement) return;

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * Set the deck to visualize
   */
  setDeck(deck: Deck3D): void {
    this.deck = deck;
    this.clearScene();
    this.createCardMeshes();
    this.arrangeCards();
  }

  /**
   * Update scene options
   */
  setSceneOptions(options: Partial<Scene3DOptions>): void {
    this.options = { ...this.options, ...options };
    this.updateScene();
  }

  /**
   * Update layout mode
   */
  setLayoutMode(mode: Partial<LayoutMode>): void {
    this.layoutMode = { ...this.layoutMode, ...mode };
    if (this.deck) {
      this.arrangeCards();
    }
  }

  /**
   * Update interaction options
   */
  setInteractionOptions(options: Partial<InteractionOptions>): void {
    this.interactionOptions = { ...this.interactionOptions, ...options };
    this.updateInteractions();
  }

  /**
   * Create 3D meshes for cards
   */
  private createCardMeshes(): void {
    if (!this.deck) return;

    this.deck.cards.forEach(card => {
      const cardMesh = this.createCardMesh(card);
      this.cardMeshes.set(card.id, cardMesh);
      this.scene.add(cardMesh);
    });

    // Create commander card if exists
    if (this.deck.commander) {
      const commanderMesh = this.createCardMesh(this.deck.commander, true);
      this.cardMeshes.set(this.deck.commander.id, commanderMesh);
      this.scene.add(commanderMesh);
    }
  }

  /**
   * Create individual card mesh
   */
  private createCardMesh(card: Card3D, isCommander: boolean = false): THREE.Mesh {
    // Card geometry (standard Magic card proportions: 63mm x 88mm)
    const cardWidth = 2.5;
    const cardHeight = 3.5;
    const cardThickness = 0.02;

    const geometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardThickness);
    
    // Create materials for front and back
    const materials = this.createCardMaterials(card, isCommander);
    
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { card, isCommander };

    // Set initial position if specified
    if (card.position) {
      mesh.position.copy(card.position);
    }
    if (card.rotation) {
      mesh.rotation.copy(card.rotation);
    }
    if (card.scale) {
      mesh.scale.copy(card.scale);
    }

    return mesh;
  }

  /**
   * Create materials for card faces
   */
  private createCardMaterials(card: Card3D, isCommander: boolean): THREE.Material[] {
    const materials: THREE.Material[] = [];

    // Side materials (edges)
    const edgeMaterial = new THREE.MeshLambertMaterial({ 
      color: this.getCardEdgeColor(card.color),
      transparent: true,
      opacity: 0.9
    });

    // Front face material
    const frontMaterial = this.createCardFrontMaterial(card, isCommander);
    
    // Back face material
    const backMaterial = new THREE.MeshLambertMaterial({
      color: 0x8B4513,
      map: this.createCardBackTexture()
    });

    // Order: right, left, top, bottom, front, back
    materials.push(edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, frontMaterial, backMaterial);

    return materials;
  }

  /**
   * Create front face material for card
   */
  private createCardFrontMaterial(card: Card3D, isCommander: boolean): THREE.Material {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 358;
    const ctx = canvas.getContext('2d')!;

    // Background based on card colors
    const bgColor = this.getCardBackgroundColor(card.color);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = isCommander ? '#FFD700' : '#000000';
    ctx.lineWidth = isCommander ? 4 : 2;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Card name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const nameY = 30;
    this.wrapText(ctx, card.name, canvas.width / 2, nameY, canvas.width - 20, 18);

    // Mana cost
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(canvas.width - 40, 10, 30, 20);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(card.manaCost.toString(), canvas.width - 25, 25);

    // Card type
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(card.type, canvas.width / 2, canvas.height - 30);

    // Quantity indicator
    if (card.quantity > 1) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(10, 10, 20, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.quantity.toString(), 20, 25);
    }

    // Commander indicator
    if (isCommander) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('COMMANDER', canvas.width / 2, canvas.height - 10);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true
    });
  }

  /**
   * Create card back texture
   */
  private createCardBackTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 358;
    const ctx = canvas.getContext('2d')!;

    // Magic card back pattern
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Pattern
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 14; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * 25, j * 25, 25, 25);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Arrange cards according to layout mode
   */
  private arrangeCards(): void {
    if (!this.deck || this.cardMeshes.size === 0) return;

    const cards = Array.from(this.cardMeshes.values());
    const positions = this.calculateCardPositions(cards.length);

    cards.forEach((mesh, index) => {
      const targetPosition = positions[index];
      this.animateCardToPosition(mesh, targetPosition);
    });
  }

  /**
   * Calculate positions for cards based on layout mode
   */
  private calculateCardPositions(cardCount: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const spacing = this.layoutMode.spacing;

    switch (this.layoutMode.type) {
      case 'grid':
        const cols = Math.ceil(Math.sqrt(cardCount));
        const rows = Math.ceil(cardCount / cols);
        for (let i = 0; i < cardCount; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = (col - (cols - 1) / 2) * spacing;
          const z = (row - (rows - 1) / 2) * spacing;
          positions.push(new THREE.Vector3(x, 0, z));
        }
        break;

      case 'spiral':
        let angle = 0;
        let radius = 0;
        for (let i = 0; i < cardCount; i++) {
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          positions.push(new THREE.Vector3(x, 0, z));
          angle += 0.5;
          radius += 0.1;
        }
        break;

      case 'stack':
        for (let i = 0; i < cardCount; i++) {
          const y = i * 0.05;
          const offset = (Math.random() - 0.5) * 0.2;
          positions.push(new THREE.Vector3(offset, y, offset));
        }
        break;

      case 'curve':
        for (let i = 0; i < cardCount; i++) {
          const t = i / (cardCount - 1);
          const x = (t - 0.5) * spacing * cardCount * 0.5;
          const y = Math.sin(t * Math.PI) * 2;
          const z = Math.cos(t * Math.PI * 2) * 2;
          positions.push(new THREE.Vector3(x, y, z));
        }
        break;

      default:
        // Default grid layout
        for (let i = 0; i < cardCount; i++) {
          const x = (i % 10 - 4.5) * spacing;
          const z = Math.floor(i / 10) * spacing;
          positions.push(new THREE.Vector3(x, 0, z));
        }
    }

    return positions;
  }

  /**
   * Animate card to target position
   */
  private animateCardToPosition(mesh: THREE.Mesh, targetPosition: THREE.Vector3): void {
    const startPosition = mesh.position.clone();
    const startTime = Date.now();
    const duration = this.layoutMode.animationDuration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      mesh.position.lerpVectors(startPosition, targetPosition, easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Export 3D model
   */
  async export3DModel(options: ExportOptions3D): Promise<Blob> {
    const exporter = this.getExporter(options.format);
    
    return new Promise((resolve, reject) => {
      const exportOptions = {
        binary: options.format === 'gltf',
        includeCustomExtensions: options.includeTextures,
        animations: options.includeAnimations ? this.getAnimations() : undefined
      };

      exporter.parse(
        this.scene,
        (result: any) => {
          let blob: Blob;
          if (options.format === 'gltf' && result instanceof ArrayBuffer) {
            blob = new Blob([result], { type: 'application/octet-stream' });
          } else {
            blob = new Blob([result], { type: 'text/plain' });
          }
          resolve(blob);
        },
        (error: any) => reject(error),
        exportOptions
      );
    });
  }

  /**
   * Get appropriate exporter for format
   */
  private getExporter(format: string): any {
    switch (format) {
      case 'gltf':
        return new GLTFExporter();
      case 'obj':
        return new OBJExporter();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get DOM element for rendering
   */
  getDOMElement(): HTMLElement {
    return this.renderer.domElement;
  }

  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    if (this.animationMixer) {
      this.animationMixer.update(delta);
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Event handlers
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.interactionOptions.hoverEffects) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.cardMeshes.values()));

    // Reset all cards
    this.cardMeshes.forEach(mesh => {
      mesh.scale.setScalar(1);
    });

    // Highlight hovered card
    if (intersects.length > 0) {
      const hoveredCard = intersects[0].object as THREE.Mesh;
      hoveredCard.scale.setScalar(1.1);
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  private onMouseClick(event: MouseEvent): void {
    if (!this.interactionOptions.enableCardSelection) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.cardMeshes.values()));

    if (intersects.length > 0) {
      const clickedCard = intersects[0].object as THREE.Mesh;
      this.selectCard(clickedCard);
    }
  }

  private onMouseDown(event: MouseEvent): void {
    // Handle drag start
  }

  private onMouseUp(event: MouseEvent): void {
    // Handle drag end
  }

  private onWindowResize(): void {
    if (this.container) {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.resize(width, height);
    }
  }

  /**
   * Helper methods
   */
  private selectCard(mesh: THREE.Mesh): void {
    // Deselect previous card
    if (this.selectedCard) {
      this.selectedCard.material = this.selectedCard.userData.originalMaterial;
    }

    // Select new card
    this.selectedCard = mesh;
    this.selectedCard.userData.originalMaterial = mesh.material;
    
    // Create selection material
    const selectionMaterial = (mesh.material as THREE.Material[]).map(mat => {
      const newMat = mat.clone();
      if (newMat instanceof THREE.MeshLambertMaterial) {
        newMat.emissive = new THREE.Color(0x444444);
      }
      return newMat;
    });
    
    mesh.material = selectionMaterial;
  }

  private clearScene(): void {
    this.cardMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.cardMeshes.clear();
  }

  private updateScene(): void {
    this.scene.background = new THREE.Color(this.options.backgroundColor);
    this.camera.position.copy(this.options.cameraPosition);
    this.renderer.setSize(this.options.width, this.options.height);
  }

  private updateInteractions(): void {
    if (this.controls) {
      this.controls.enableZoom = this.interactionOptions.enableZoom;
      this.controls.enableRotate = this.interactionOptions.enableRotation;
    }
  }

  private getCardEdgeColor(colors: string[]): number {
    if (colors.length === 0) return 0x888888;
    
    const colorMap: Record<string, number> = {
      'W': 0xFFFBD5,
      'U': 0x0E68AB,
      'B': 0x150B00,
      'R': 0xD3202A,
      'G': 0x00733E,
      'C': 0x888888
    };

    return colorMap[colors[0]] || 0x888888;
  }

  private getCardBackgroundColor(colors: string[]): string {
    if (colors.length === 0) return '#CCCCCC';
    
    const colorMap: Record<string, string> = {
      'W': '#FFFBD5',
      'U': '#0E68AB',
      'B': '#150B00',
      'R': '#D3202A',
      'G': '#00733E',
      'C': '#CCCCCC'
    };

    return colorMap[colors[0]] || '#CCCCCC';
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  private getAnimations(): THREE.AnimationClip[] {
    // Return any animations if they exist
    return [];
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clearScene();
    this.renderer.dispose();
    if (this.controls) {
      this.controls.dispose();
    }
  }
}

export default Deck3DModelCreator;
