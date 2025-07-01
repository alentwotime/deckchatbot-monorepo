/**
 * Visual Feature Types for DeckChatBot
 * Comprehensive TypeScript type definitions for visual features, 3D models, and image processing
 */
export interface ThreeDModelConfig {
    id?: string;
    name: string;
    description?: string;
    version: string;
    format: '3ds' | 'obj' | 'fbx' | 'gltf' | 'dae' | 'blend';
    geometry: {
        vertices: number;
        faces: number;
        triangles: number;
        materials: number;
        textures: number;
    };
    rendering: {
        quality: 'low' | 'medium' | 'high' | 'ultra';
        levelOfDetail: boolean;
        culling: 'none' | 'frustum' | 'occlusion' | 'both';
        shadows: {
            enabled: boolean;
            type: 'hard' | 'soft' | 'cascade';
            resolution: number;
            distance: number;
        };
        lighting: {
            model: 'phong' | 'blinn' | 'pbr' | 'toon';
            ambient: {
                r: number;
                g: number;
                b: number;
                intensity: number;
            };
            directional: {
                r: number;
                g: number;
                b: number;
                intensity: number;
                direction: Vector3;
            };
            point: PointLight[];
            spot: SpotLight[];
        };
    };
    animation: {
        enabled: boolean;
        fps: number;
        duration: number;
        loop: boolean;
        autoPlay: boolean;
        tracks: AnimationTrack[];
    };
    physics: {
        enabled: boolean;
        engine: 'cannon' | 'ammo' | 'oimo';
        gravity: Vector3;
        collisionDetection: 'discrete' | 'continuous';
        bodies: PhysicsBody[];
    };
    performance: {
        targetFPS: number;
        adaptiveQuality: boolean;
        frustumCulling: boolean;
        occlusionCulling: boolean;
        instancedRendering: boolean;
        batchRendering: boolean;
    };
    assets: {
        modelPath: string;
        texturePaths: string[];
        materialPaths: string[];
        animationPaths: string[];
        soundPaths: string[];
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        author: string;
        license: string;
        tags: string[];
        fileSize: number;
        checksum: string;
    };
}
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export interface PointLight {
    position: Vector3;
    color: {
        r: number;
        g: number;
        b: number;
    };
    intensity: number;
    range: number;
    decay: number;
}
export interface SpotLight {
    position: Vector3;
    target: Vector3;
    color: {
        r: number;
        g: number;
        b: number;
    };
    intensity: number;
    range: number;
    angle: number;
    penumbra: number;
    decay: number;
}
export interface AnimationTrack {
    name: string;
    type: 'position' | 'rotation' | 'scale' | 'morph' | 'material';
    target: string;
    keyframes: Keyframe[];
    interpolation: 'linear' | 'step' | 'cubic';
}
export interface Keyframe {
    time: number;
    value: number | Vector3 | Quaternion;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}
export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}
export interface PhysicsBody {
    name: string;
    type: 'static' | 'dynamic' | 'kinematic';
    shape: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'mesh';
    mass: number;
    friction: number;
    restitution: number;
    position: Vector3;
    rotation: Vector3;
}
export interface BlueprintSettings {
    grid: {
        enabled: boolean;
        size: number;
        subdivisions: number;
        color: string;
        opacity: number;
        snapToGrid: boolean;
        showLabels: boolean;
    };
    layout: {
        type: 'manual' | 'auto' | 'template';
        template?: 'standard' | 'commander' | 'limited' | 'custom';
        autoArrange: boolean;
        spacing: {
            horizontal: number;
            vertical: number;
            margin: number;
        };
        alignment: 'left' | 'center' | 'right' | 'justify';
        grouping: {
            enabled: boolean;
            by: 'type' | 'cost' | 'color' | 'rarity' | 'custom';
            showHeaders: boolean;
        };
    };
    cards: {
        size: {
            width: number;
            height: number;
            maintainAspectRatio: boolean;
        };
        style: 'realistic' | 'simplified' | 'symbolic' | 'text-only';
        showQuantity: boolean;
        showCost: boolean;
        showType: boolean;
        showRarity: boolean;
        colorCoding: boolean;
        borders: {
            enabled: boolean;
            color: string;
            width: number;
            style: 'solid' | 'dashed' | 'dotted';
        };
    };
    interaction: {
        selectable: boolean;
        draggable: boolean;
        resizable: boolean;
        rotatable: boolean;
        contextMenu: boolean;
        tooltips: boolean;
        zoom: {
            enabled: boolean;
            min: number;
            max: number;
            step: number;
        };
        pan: {
            enabled: boolean;
            bounds?: {
                left: number;
                top: number;
                right: number;
                bottom: number;
            };
        };
    };
    effects: {
        shadows: boolean;
        highlights: boolean;
        animations: {
            enabled: boolean;
            duration: number;
            easing: string;
            hover: boolean;
            selection: boolean;
        };
        transitions: {
            enabled: boolean;
            duration: number;
            type: 'fade' | 'slide' | 'scale' | 'rotate';
        };
    };
    export: {
        formats: ('png' | 'jpg' | 'svg' | 'pdf')[];
        resolution: {
            width: number;
            height: number;
            dpi: number;
        };
        quality: number;
        includeMetadata: boolean;
        watermark?: {
            enabled: boolean;
            text: string;
            position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
            opacity: number;
        };
    };
    theme: {
        name: string;
        colors: {
            background: string;
            foreground: string;
            accent: string;
            text: string;
            border: string;
            grid: string;
            selection: string;
            hover: string;
        };
        fonts: {
            primary: string;
            secondary: string;
            monospace: string;
            sizes: {
                small: number;
                medium: number;
                large: number;
            };
        };
    };
}
export interface ImageProcessingOptions {
    input: {
        format: 'auto' | 'jpg' | 'png' | 'webp' | 'tiff' | 'bmp';
        quality: number;
        maxSize: {
            width: number;
            height: number;
            fileSize: number;
        };
        validation: {
            allowedFormats: string[];
            minDimensions: {
                width: number;
                height: number;
            };
            maxDimensions: {
                width: number;
                height: number;
            };
            aspectRatioRange?: {
                min: number;
                max: number;
            };
        };
    };
    preprocessing: {
        resize: {
            enabled: boolean;
            method: 'nearest' | 'bilinear' | 'bicubic' | 'lanczos';
            width?: number;
            height?: number;
            maintainAspectRatio: boolean;
            upscaling: boolean;
        };
        rotation: {
            enabled: boolean;
            autoDetect: boolean;
            angle?: number;
            method: 'nearest' | 'bilinear' | 'bicubic';
        };
        cropping: {
            enabled: boolean;
            autoDetect: boolean;
            bounds?: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            padding: number;
        };
        normalization: {
            enabled: boolean;
            brightness: number;
            contrast: number;
            saturation: number;
            gamma: number;
            whiteBalance: boolean;
        };
    };
    enhancement: {
        denoising: {
            enabled: boolean;
            strength: number;
            method: 'gaussian' | 'bilateral' | 'nlm' | 'bm3d';
        };
        sharpening: {
            enabled: boolean;
            strength: number;
            radius: number;
            threshold: number;
        };
        edgeEnhancement: {
            enabled: boolean;
            method: 'unsharp' | 'laplacian' | 'sobel' | 'canny';
            strength: number;
        };
        colorCorrection: {
            enabled: boolean;
            autoLevels: boolean;
            autoContrast: boolean;
            autoColor: boolean;
            curves?: {
                red: number[];
                green: number[];
                blue: number[];
                rgb: number[];
            };
        };
    };
    ocr: {
        textEnhancement: {
            enabled: boolean;
            binarization: {
                method: 'otsu' | 'adaptive' | 'manual';
                threshold?: number;
            };
            morphology: {
                enabled: boolean;
                operations: ('erosion' | 'dilation' | 'opening' | 'closing')[];
                kernelSize: number;
            };
            skewCorrection: {
                enabled: boolean;
                maxAngle: number;
                method: 'hough' | 'projection' | 'moments';
            };
        };
        regionDetection: {
            enabled: boolean;
            method: 'mser' | 'swt' | 'east' | 'craft';
            minArea: number;
            maxArea: number;
            aspectRatioRange: {
                min: number;
                max: number;
            };
        };
    };
    cardDetection: {
        enabled: boolean;
        templateMatching: {
            enabled: boolean;
            templates: string[];
            threshold: number;
            method: 'ccoeff' | 'ccorr' | 'sqdiff';
        };
        contourDetection: {
            enabled: boolean;
            minArea: number;
            maxArea: number;
            approximation: number;
            convexHull: boolean;
        };
        cornerDetection: {
            enabled: boolean;
            method: 'harris' | 'shi-tomasi' | 'fast' | 'orb';
            maxCorners: number;
            qualityLevel: number;
            minDistance: number;
        };
    };
    output: {
        format: 'jpg' | 'png' | 'webp' | 'tiff';
        quality: number;
        compression: {
            enabled: boolean;
            level: number;
            lossless: boolean;
        };
        metadata: {
            preserve: boolean;
            add: Record<string, any>;
            remove: string[];
        };
        watermark?: {
            enabled: boolean;
            type: 'text' | 'image';
            content: string;
            position: Vector2;
            opacity: number;
            size: number;
        };
    };
    performance: {
        parallel: boolean;
        maxThreads: number;
        memoryLimit: number;
        timeout: number;
        caching: {
            enabled: boolean;
            maxSize: number;
            ttl: number;
        };
    };
}
export interface Vector2 {
    x: number;
    y: number;
}
export interface DrawingAnalysis {
    input: {
        imageId: string;
        fileName: string;
        dimensions: {
            width: number;
            height: number;
        };
        format: string;
        fileSize: number;
        uploadedAt: Date;
        userId: string;
    };
    metadata: {
        analysisId: string;
        version: string;
        startTime: Date;
        endTime: Date;
        processingTime: number;
        confidence: number;
        status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
        error?: string;
    };
    characteristics: {
        type: 'sketch' | 'diagram' | 'photo' | 'scan' | 'digital' | 'mixed';
        style: 'realistic' | 'cartoon' | 'technical' | 'artistic' | 'schematic';
        medium: 'pencil' | 'pen' | 'marker' | 'digital' | 'mixed' | 'unknown';
        quality: {
            overall: number;
            clarity: number;
            contrast: number;
            completeness: number;
            accuracy: number;
        };
        complexity: {
            level: 'simple' | 'moderate' | 'complex' | 'very-complex';
            elementCount: number;
            detailLevel: number;
            layerCount: number;
        };
    };
    elements: {
        cards: DetectedCard[];
        text: DetectedText[];
        shapes: DetectedShape[];
        lines: DetectedLine[];
        annotations: DetectedAnnotation[];
        symbols: DetectedSymbol[];
    };
    layout: {
        structure: 'grid' | 'list' | 'pile' | 'spread' | 'circular' | 'custom' | 'chaotic';
        organization: {
            grouped: boolean;
            aligned: boolean;
            spaced: boolean;
            ordered: boolean;
        };
        regions: LayoutRegion[];
        relationships: ElementRelationship[];
    };
    recognition: {
        cardNames: RecognizedCardName[];
        quantities: RecognizedQuantity[];
        categories: RecognizedCategory[];
        formats: RecognizedFormat[];
        confidence: {
            overall: number;
            cards: number;
            text: number;
            layout: number;
        };
    };
    suggestions: {
        improvements: Suggestion[];
        corrections: Correction[];
        alternatives: Alternative[];
        enhancements: Enhancement[];
    };
    statistics: {
        totalElements: number;
        recognizedElements: number;
        recognitionRate: number;
        averageConfidence: number;
        processingSteps: ProcessingStep[];
        performance: {
            memoryUsed: number;
            cpuTime: number;
            gpuTime?: number;
            networkTime?: number;
        };
    };
}
export interface DetectedCard {
    id: string;
    name?: string;
    confidence: number;
    boundingBox: BoundingBox;
    corners: Vector2[];
    properties: {
        quantity?: number;
        set?: string;
        rarity?: string;
        cost?: string;
        type?: string;
        colors?: string[];
    };
    visual: {
        rotation: number;
        scale: number;
        perspective: number;
        occlusion: number;
        blur: number;
    };
    alternatives: {
        name: string;
        confidence: number;
    }[];
}
export interface DetectedText {
    id: string;
    text: string;
    confidence: number;
    boundingBox: BoundingBox;
    properties: {
        language: string;
        font?: string;
        size: number;
        style: 'normal' | 'bold' | 'italic' | 'underline';
        color: string;
        orientation: number;
    };
    context: {
        type: 'card-name' | 'quantity' | 'annotation' | 'label' | 'other';
        relatedElements: string[];
    };
}
export interface DetectedShape {
    id: string;
    type: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'line' | 'curve';
    confidence: number;
    boundingBox: BoundingBox;
    properties: {
        filled: boolean;
        strokeWidth: number;
        strokeColor: string;
        fillColor?: string;
        vertices?: Vector2[];
    };
    purpose: 'border' | 'separator' | 'highlight' | 'decoration' | 'unknown';
}
export interface DetectedLine {
    id: string;
    start: Vector2;
    end: Vector2;
    confidence: number;
    properties: {
        thickness: number;
        style: 'solid' | 'dashed' | 'dotted' | 'wavy';
        color: string;
        length: number;
        angle: number;
    };
    purpose: 'separator' | 'connector' | 'border' | 'arrow' | 'underline' | 'unknown';
}
export interface DetectedAnnotation {
    id: string;
    type: 'arrow' | 'circle' | 'highlight' | 'note' | 'correction' | 'emphasis';
    confidence: number;
    boundingBox: BoundingBox;
    properties: {
        color: string;
        style: string;
        target?: string;
    };
    content?: string;
}
export interface DetectedSymbol {
    id: string;
    symbol: string;
    confidence: number;
    boundingBox: BoundingBox;
    properties: {
        type: 'mana' | 'rarity' | 'set' | 'mathematical' | 'currency' | 'other';
        value?: string | number;
        color?: string;
    };
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface LayoutRegion {
    id: string;
    type: 'header' | 'body' | 'footer' | 'sidebar' | 'mainboard' | 'sideboard' | 'notes';
    boundingBox: BoundingBox;
    elements: string[];
    confidence: number;
}
export interface ElementRelationship {
    id: string;
    type: 'contains' | 'adjacent' | 'aligned' | 'grouped' | 'connected' | 'overlaps';
    source: string;
    target: string;
    confidence: number;
    properties?: Record<string, any>;
}
export interface RecognizedCardName {
    name: string;
    confidence: number;
    elementId: string;
    alternatives: {
        name: string;
        confidence: number;
    }[];
    metadata: {
        source: 'ocr' | 'image' | 'context' | 'database';
        verified: boolean;
        corrections: string[];
    };
}
export interface RecognizedQuantity {
    value: number;
    confidence: number;
    elementId: string;
    relatedCard?: string;
    format: 'numeric' | 'written' | 'tally' | 'symbol';
}
export interface RecognizedCategory {
    category: string;
    confidence: number;
    elements: string[];
    properties: Record<string, any>;
}
export interface RecognizedFormat {
    format: string;
    confidence: number;
    indicators: string[];
    restrictions?: string[];
}
export interface Suggestion {
    type: 'quality' | 'recognition' | 'layout' | 'completeness';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    action?: string;
    impact: number;
}
export interface Correction {
    type: 'card-name' | 'quantity' | 'spelling' | 'format' | 'layout';
    elementId: string;
    original: string;
    suggested: string;
    confidence: number;
    reason: string;
}
export interface Alternative {
    type: 'card' | 'layout' | 'interpretation';
    elementId?: string;
    description: string;
    confidence: number;
    changes: Record<string, any>;
}
export interface Enhancement {
    type: 'image-quality' | 'recognition' | 'layout' | 'metadata';
    description: string;
    method: string;
    expectedImprovement: number;
    cost: 'low' | 'medium' | 'high';
}
export interface ProcessingStep {
    name: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    status: 'completed' | 'failed' | 'skipped';
    input?: any;
    output?: any;
    error?: string;
}
export type VisualQuality = 'low' | 'medium' | 'high' | 'ultra';
export type RenderingEngine = 'webgl' | 'webgl2' | 'webgpu' | 'canvas' | 'svg';
export type ImageFormat = 'jpg' | 'png' | 'webp' | 'tiff' | 'bmp' | 'svg' | 'pdf';
export type ModelFormat = '3ds' | 'obj' | 'fbx' | 'gltf' | 'dae' | 'blend';
export type ProcessingMethod = 'cpu' | 'gpu' | 'hybrid' | 'cloud';
export type AnalysisType = 'quick' | 'standard' | 'detailed' | 'comprehensive';
//# sourceMappingURL=visual.d.ts.map