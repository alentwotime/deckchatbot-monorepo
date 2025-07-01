/**
 * Type Import Test
 * Simple test to verify all types can be imported correctly
 */
// Test importing from index
import { 
// Type guards
isChatMessage, isDeckCard, 
// Constants
DECK_FORMATS, CARD_RARITIES, AZURE_REGIONS, 
// Default values
DEFAULT_QUERY_OPTIONS, DEFAULT_CHAT_OPTIONS } from './index.js';
/**
 * Test function to verify types work correctly
 */
export function testTypes() {
    console.log('🧪 Testing TypeScript type definitions...');
    // Test ChatMessage
    const testMessage = {
        sessionId: 'test-session',
        userId: 'test-user',
        role: 'user',
        content: 'Hello, world!',
        timestamp: new Date()
    };
    console.log('✅ ChatMessage type works:', isChatMessage(testMessage));
    // Test DeckCard
    const testCard = {
        name: 'Lightning Bolt',
        manaCost: '{R}',
        convertedManaCost: 1,
        type: 'Instant',
        rarity: 'common',
        set: 'LEA',
        colors: ['Red'],
        quantity: 4
    };
    console.log('✅ DeckCard type works:', isDeckCard(testCard));
    // Test AzureConfig
    const testAzureConfig = {
        subscriptionId: 'test-subscription',
        resourceGroupName: 'test-rg',
        region: 'East US'
    };
    console.log('✅ AzureConfig type works');
    // Test ScrollingWebsiteState
    const testScrollState = {
        currentSection: 'hero',
        scrollPosition: 0,
        isScrolling: false,
        animations: {
            fadeIn: true,
            slideUp: true,
            parallax: false
        },
        theme: 'dark',
        layout: 'desktop'
    };
    console.log('✅ ScrollingWebsiteState type works');
    // Test DeckVisualization3D
    const test3DVisualization = {
        enabled: true,
        viewMode: 'grid',
        cardRotation: { x: 0, y: 0, z: 0 },
        cameraPosition: { x: 0, y: 5, z: 10 },
        lighting: {
            ambient: 0.4,
            directional: 0.8,
            shadows: true
        },
        animations: {
            cardFlip: true,
            hoverEffects: true,
            transitionSpeed: 0.3
        }
    };
    console.log('✅ DeckVisualization3D type works');
    // Test DeckDigitizer
    const testDigitizer = {
        isActive: false,
        mode: 'camera',
        confidence: 0.95,
        recognizedCards: [
            {
                name: 'Lightning Bolt',
                confidence: 0.98,
                quantity: 4,
                boundingBox: { x: 10, y: 10, width: 100, height: 140 }
            }
        ],
        processingStatus: 'idle',
        settings: {
            autoCorrect: true,
            multipleAngles: false,
            enhanceImage: true,
            batchProcessing: false
        }
    };
    console.log('✅ DeckDigitizer type works');
    // Test ThreeDModelConfig
    const test3DModel = {
        name: 'Test 3D Model',
        version: '1.0.0',
        format: 'gltf',
        geometry: {
            vertices: 1000,
            faces: 500,
            triangles: 1000,
            materials: 2,
            textures: 3
        },
        rendering: {
            quality: 'high',
            levelOfDetail: true,
            culling: 'frustum',
            shadows: {
                enabled: true,
                type: 'soft',
                resolution: 1024,
                distance: 100
            },
            lighting: {
                model: 'pbr',
                ambient: { r: 0.2, g: 0.2, b: 0.2, intensity: 0.5 },
                directional: { r: 1, g: 1, b: 1, intensity: 1, direction: { x: 0, y: -1, z: 0 } },
                point: [],
                spot: []
            }
        },
        animation: {
            enabled: false,
            fps: 30,
            duration: 0,
            loop: false,
            autoPlay: false,
            tracks: []
        },
        physics: {
            enabled: false,
            engine: 'cannon',
            gravity: { x: 0, y: -9.81, z: 0 },
            collisionDetection: 'discrete',
            bodies: []
        },
        performance: {
            targetFPS: 60,
            adaptiveQuality: true,
            frustumCulling: true,
            occlusionCulling: false,
            instancedRendering: true,
            batchRendering: true
        },
        assets: {
            modelPath: '/models/test.gltf',
            texturePaths: ['/textures/diffuse.jpg'],
            materialPaths: ['/materials/test.json'],
            animationPaths: [],
            soundPaths: []
        },
        metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            author: 'Test Author',
            license: 'MIT',
            tags: ['test', '3d'],
            fileSize: 1024000,
            checksum: 'abc123'
        }
    };
    console.log('✅ ThreeDModelConfig type works');
    // Test BlueprintSettings
    const testBlueprintSettings = {
        grid: {
            enabled: true,
            size: 10,
            subdivisions: 10,
            color: '#cccccc',
            opacity: 0.5,
            snapToGrid: true,
            showLabels: false
        },
        layout: {
            type: 'auto',
            template: 'standard',
            autoArrange: true,
            spacing: {
                horizontal: 5,
                vertical: 5,
                margin: 10
            },
            alignment: 'center',
            grouping: {
                enabled: true,
                by: 'type',
                showHeaders: true
            }
        },
        cards: {
            size: {
                width: 63,
                height: 88,
                maintainAspectRatio: true
            },
            style: 'realistic',
            showQuantity: true,
            showCost: true,
            showType: true,
            showRarity: true,
            colorCoding: true,
            borders: {
                enabled: true,
                color: '#000000',
                width: 1,
                style: 'solid'
            }
        },
        interaction: {
            selectable: true,
            draggable: true,
            resizable: false,
            rotatable: false,
            contextMenu: true,
            tooltips: true,
            zoom: {
                enabled: true,
                min: 0.1,
                max: 5.0,
                step: 0.1
            },
            pan: {
                enabled: true
            }
        },
        effects: {
            shadows: true,
            highlights: true,
            animations: {
                enabled: true,
                duration: 300,
                easing: 'ease-in-out',
                hover: true,
                selection: true
            },
            transitions: {
                enabled: true,
                duration: 200,
                type: 'fade'
            }
        },
        export: {
            formats: ['png', 'jpg', 'svg'],
            resolution: {
                width: 1920,
                height: 1080,
                dpi: 300
            },
            quality: 0.9,
            includeMetadata: true
        },
        theme: {
            name: 'default',
            colors: {
                background: '#ffffff',
                foreground: '#000000',
                accent: '#0066cc',
                text: '#333333',
                border: '#cccccc',
                grid: '#eeeeee',
                selection: '#0066cc',
                hover: '#f0f0f0'
            },
            fonts: {
                primary: 'Arial, sans-serif',
                secondary: 'Georgia, serif',
                monospace: 'Courier New, monospace',
                sizes: {
                    small: 12,
                    medium: 14,
                    large: 18
                }
            }
        }
    };
    console.log('✅ BlueprintSettings type works');
    // Test DeckBlueprint
    const testDeckBlueprint = {
        userId: 'test-user',
        name: 'Test Blueprint',
        imageUrl: '/images/test-blueprint.jpg',
        recognizedCards: [
            {
                name: 'Lightning Bolt',
                confidence: 0.95,
                quantity: 4,
                boundingBox: { x: 10, y: 10, width: 63, height: 88 },
                metadata: {
                    recognitionMethod: 'ocr',
                    processingTime: 100,
                    verified: false
                }
            }
        ],
        layout: {
            width: 800,
            height: 600,
            cardPositions: [
                {
                    cardId: 'card-1',
                    x: 10,
                    y: 10,
                    width: 63,
                    height: 88,
                    rotation: 0,
                    zIndex: 1,
                    category: 'mainboard'
                }
            ],
            gridType: 'auto'
        },
        metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            confidence: 0.9,
            processingTime: 1500,
            source: 'photo'
        },
        settings: testBlueprintSettings
    };
    console.log('✅ DeckBlueprint type works');
    // Test OCR types
    const testOCRRequest = {
        imageUrl: '/images/test-card.jpg',
        language: 'en',
        detectOrientation: true,
        options: {
            enhanceImage: true,
            removeBackground: false,
            adjustContrast: true
        }
    };
    console.log('✅ OCRRequest type works');
    // Test constants
    console.log('✅ DECK_FORMATS:', DECK_FORMATS.length, 'formats available');
    console.log('✅ CARD_RARITIES:', CARD_RARITIES.length, 'rarities available');
    console.log('✅ AZURE_REGIONS:', AZURE_REGIONS.length, 'regions available');
    // Test default values
    console.log('✅ DEFAULT_QUERY_OPTIONS:', DEFAULT_QUERY_OPTIONS);
    console.log('✅ DEFAULT_CHAT_OPTIONS:', DEFAULT_CHAT_OPTIONS);
    console.log('🎉 All type definitions are working correctly!');
}
/**
 * Test Azure Service Bus message types
 */
export function testServiceBusTypes() {
    console.log('🧪 Testing Azure Service Bus message types...');
    const testDeckAnalysisMessage = {
        messageId: 'test-msg-123',
        body: {
            deckId: 'deck-123',
            userId: 'user-456',
            deckList: '4 Lightning Bolt\n20 Mountain',
            format: 'Modern',
            analysisType: 'competitive',
            priority: 'normal',
            requestedAt: new Date()
        }
    };
    console.log('✅ DeckAnalysisMessage type works');
    const testNotificationMessage = {
        messageId: 'notif-123',
        body: {
            userId: 'user-456',
            type: 'deck_analysis_complete',
            title: 'Deck Analysis Complete',
            message: 'Your deck analysis is ready!',
            channels: ['in_app', 'email'],
            priority: 'normal'
        }
    };
    console.log('✅ NotificationMessage type works');
    console.log('🎉 All Azure Service Bus types are working correctly!');
}
/**
 * Test Visual Feature and Computer Vision types
 */
export function testVisualAndComputerVisionTypes() {
    console.log('🧪 Testing Visual Feature and Computer Vision types...');
    // Test ImageProcessingOptions
    const testImageProcessing = {
        input: {
            format: 'auto',
            quality: 0.9,
            maxSize: {
                width: 4096,
                height: 4096,
                fileSize: 10485760 // 10MB
            },
            validation: {
                allowedFormats: ['jpg', 'png', 'webp'],
                minDimensions: { width: 100, height: 100 },
                maxDimensions: { width: 8192, height: 8192 }
            }
        },
        preprocessing: {
            resize: {
                enabled: true,
                method: 'bicubic',
                maintainAspectRatio: true,
                upscaling: false
            },
            rotation: {
                enabled: true,
                autoDetect: true,
                method: 'bicubic'
            },
            cropping: {
                enabled: false,
                autoDetect: false,
                padding: 0
            },
            normalization: {
                enabled: true,
                brightness: 0,
                contrast: 0,
                saturation: 0,
                gamma: 1.0,
                whiteBalance: false
            }
        },
        enhancement: {
            denoising: {
                enabled: true,
                strength: 0.5,
                method: 'bilateral'
            },
            sharpening: {
                enabled: true,
                strength: 0.3,
                radius: 1.0,
                threshold: 0.1
            },
            edgeEnhancement: {
                enabled: false,
                method: 'unsharp',
                strength: 0.5
            },
            colorCorrection: {
                enabled: true,
                autoLevels: true,
                autoContrast: true,
                autoColor: false
            }
        },
        ocr: {
            textEnhancement: {
                enabled: true,
                binarization: {
                    method: 'otsu'
                },
                morphology: {
                    enabled: true,
                    operations: ['erosion', 'dilation'],
                    kernelSize: 3
                },
                skewCorrection: {
                    enabled: true,
                    maxAngle: 45,
                    method: 'hough'
                }
            },
            regionDetection: {
                enabled: true,
                method: 'mser',
                minArea: 100,
                maxArea: 10000,
                aspectRatioRange: { min: 0.1, max: 10.0 }
            }
        },
        cardDetection: {
            enabled: true,
            templateMatching: {
                enabled: true,
                templates: ['/templates/mtg-card.jpg'],
                threshold: 0.8,
                method: 'ccoeff'
            },
            contourDetection: {
                enabled: true,
                minArea: 1000,
                maxArea: 50000,
                approximation: 0.02,
                convexHull: true
            },
            cornerDetection: {
                enabled: true,
                method: 'harris',
                maxCorners: 100,
                qualityLevel: 0.01,
                minDistance: 10
            }
        },
        output: {
            format: 'png',
            quality: 0.95,
            compression: {
                enabled: true,
                level: 6,
                lossless: false
            },
            metadata: {
                preserve: true,
                add: { processed: 'true' },
                remove: ['gps']
            }
        },
        performance: {
            parallel: true,
            maxThreads: 4,
            memoryLimit: 1024,
            timeout: 30,
            caching: {
                enabled: true,
                maxSize: 512,
                ttl: 3600
            }
        }
    };
    console.log('✅ ImageProcessingOptions type works');
    // Test DrawingAnalysis
    const testDrawingAnalysis = {
        input: {
            imageId: 'img-123',
            fileName: 'deck-sketch.jpg',
            dimensions: { width: 1920, height: 1080 },
            format: 'jpg',
            fileSize: 2048000,
            uploadedAt: new Date(),
            userId: 'user-456'
        },
        metadata: {
            analysisId: 'analysis-789',
            version: '1.0.0',
            startTime: new Date(),
            endTime: new Date(),
            processingTime: 5000,
            confidence: 0.85,
            status: 'completed'
        },
        characteristics: {
            type: 'sketch',
            style: 'technical',
            medium: 'pencil',
            quality: {
                overall: 0.8,
                clarity: 0.9,
                contrast: 0.7,
                completeness: 0.85,
                accuracy: 0.8
            },
            complexity: {
                level: 'moderate',
                elementCount: 25,
                detailLevel: 0.7,
                layerCount: 1
            }
        },
        elements: {
            cards: [],
            text: [],
            shapes: [],
            lines: [],
            annotations: [],
            symbols: []
        },
        layout: {
            structure: 'grid',
            organization: {
                grouped: true,
                aligned: true,
                spaced: true,
                ordered: true
            },
            regions: [],
            relationships: []
        },
        recognition: {
            cardNames: [],
            quantities: [],
            categories: [],
            formats: [],
            confidence: {
                overall: 0.85,
                cards: 0.9,
                text: 0.8,
                layout: 0.85
            }
        },
        suggestions: {
            improvements: [],
            corrections: [],
            alternatives: [],
            enhancements: []
        },
        statistics: {
            totalElements: 25,
            recognizedElements: 20,
            recognitionRate: 0.8,
            averageConfidence: 0.85,
            processingSteps: [],
            performance: {
                memoryUsed: 256,
                cpuTime: 4500,
                gpuTime: 500
            }
        }
    };
    console.log('✅ DrawingAnalysis type works');
    // Test CardRecognitionResponse
    const testCardRecognition = {
        cards: [
            {
                name: 'Lightning Bolt',
                confidence: 0.95,
                quantity: 4,
                set: 'LEA',
                rarity: 'common',
                manaCost: '{R}',
                type: 'Instant',
                boundingBox: { x: 10, y: 10, width: 63, height: 88 },
                metadata: {
                    recognitionMethod: 'hybrid',
                    processingTime: 150,
                    verified: true
                }
            }
        ],
        totalFound: 1,
        processingTime: 1200,
        confidence: 0.95,
        metadata: {
            imageSize: { width: 800, height: 600 },
            recognitionMethod: 'hybrid',
            enhancementsApplied: ['contrast', 'sharpening']
        }
    };
    console.log('✅ CardRecognitionResponse type works');
    console.log('🎉 All Visual Feature and Computer Vision types are working correctly!');
}
// Export test functions for use in other files
export { testTypes as default };
//# sourceMappingURL=test-types.js.map