import { z } from 'zod';
import validator from 'validator';
// ==================== BASE VALIDATION SCHEMAS ====================
// Common field validations
export const commonSchemas = {
    id: z.string().uuid('Invalid UUID format'),
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character'),
    url: z.string().url('Invalid URL format'),
    positiveInt: z.number().int().positive('Must be a positive integer'),
    nonNegativeInt: z.number().int().min(0, 'Must be non-negative'),
    timestamp: z.string().datetime('Invalid timestamp format'),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
};
// ==================== MTG-SPECIFIC VALIDATORS ====================
// MTG card name validation
export const mtgCardName = z.string()
    .min(1, 'Card name is required')
    .max(100, 'Card name too long')
    .regex(/^[a-zA-Z0-9\s\-',\.\/\(\)]+$/, 'Invalid characters in card name');
// MTG mana cost validation
export const mtgManaCost = z.string()
    .regex(/^(\{[WUBRGCXYZ0-9]+\})*$/, 'Invalid mana cost format')
    .optional();
// MTG color validation
export const mtgColor = z.enum(['W', 'U', 'B', 'R', 'G', 'C'], {
    errorMap: () => ({ message: 'Invalid MTG color' })
});
export const mtgColors = z.array(mtgColor).max(5, 'Too many colors');
// MTG card type validation
export const mtgCardType = z.enum([
    'Artifact', 'Creature', 'Enchantment', 'Instant', 'Land',
    'Planeswalker', 'Sorcery', 'Tribal', 'Battle'
], {
    errorMap: () => ({ message: 'Invalid MTG card type' })
});
// MTG rarity validation
export const mtgRarity = z.enum(['common', 'uncommon', 'rare', 'mythic'], {
    errorMap: () => ({ message: 'Invalid MTG rarity' })
});
// MTG set code validation
export const mtgSetCode = z.string()
    .length(3, 'Set code must be exactly 3 characters')
    .regex(/^[A-Z0-9]{3}$/, 'Set code must be uppercase letters/numbers');
// MTG format validation
export const mtgFormat = z.enum([
    'standard', 'pioneer', 'modern', 'legacy', 'vintage',
    'commander', 'pauper', 'historic', 'alchemy'
], {
    errorMap: () => ({ message: 'Invalid MTG format' })
});
// Deck validation schemas
export const deckCardSchema = z.object({
    cardId: commonSchemas.id,
    cardName: mtgCardName,
    quantity: z.number().int().min(1).max(4, 'Maximum 4 copies of a card'),
    isSideboard: z.boolean().default(false),
});
export const deckSchema = z.object({
    name: z.string().min(1, 'Deck name is required').max(100, 'Deck name too long'),
    format: mtgFormat,
    description: z.string().max(1000, 'Description too long').optional(),
    cards: z.array(deckCardSchema)
        .min(1, 'Deck must contain at least one card')
        .max(100, 'Deck cannot exceed 100 cards'),
    colors: mtgColors.optional(),
    isPublic: z.boolean().default(false),
});
// ==================== IMAGE VALIDATION SCHEMAS ====================
// Image file validation
export const imageFileSchema = z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum([
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'image/gif', 'image/bmp', 'image/tiff'
    ], { errorMap: () => ({ message: 'Invalid image format' }) }),
    size: z.number()
        .max(10 * 1024 * 1024, 'Image size cannot exceed 10MB')
        .min(1, 'Image file is empty'),
    buffer: z.instanceof(Buffer),
});
// Image processing options
export const imageProcessingSchema = z.object({
    resize: z.object({
        width: z.number().int().min(50).max(4000).optional(),
        height: z.number().int().min(50).max(4000).optional(),
        maintainAspectRatio: z.boolean().default(true),
    }).optional(),
    quality: z.number().int().min(1).max(100).default(85),
    format: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
    optimize: z.boolean().default(true),
});
// Card image upload schema
export const cardImageUploadSchema = z.object({
    cardId: commonSchemas.id.optional(),
    cardName: mtgCardName.optional(),
    setCode: mtgSetCode.optional(),
    imageType: z.enum(['card', 'art', 'symbol']).default('card'),
    processing: imageProcessingSchema.optional(),
});
// ==================== DRAWING VALIDATION SCHEMAS ====================
// Drawing coordinates validation
export const coordinateSchema = z.object({
    x: z.number().min(0).max(10000),
    y: z.number().min(0).max(10000),
});
// Drawing stroke validation
export const strokeSchema = z.object({
    points: z.array(coordinateSchema).min(2, 'Stroke must have at least 2 points'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    width: z.number().min(1).max(50),
    opacity: z.number().min(0).max(1).default(1),
});
// Drawing layer validation
export const drawingLayerSchema = z.object({
    id: z.string(),
    name: z.string().max(50),
    strokes: z.array(strokeSchema),
    visible: z.boolean().default(true),
    locked: z.boolean().default(false),
});
// Complete drawing validation
export const drawingSchema = z.object({
    id: commonSchemas.id.optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    canvas: z.object({
        width: z.number().int().min(100).max(4000),
        height: z.number().int().min(100).max(4000),
        backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
    }),
    layers: z.array(drawingLayerSchema).min(1, 'Drawing must have at least one layer'),
    tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags'),
    isPublic: z.boolean().default(false),
});
// ==================== API ENDPOINT SCHEMAS ====================
// User registration
export const userRegistrationSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
});
// User login
export const userLoginSchema = z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
});
// Card search
export const cardSearchSchema = z.object({
    query: z.string().min(1, 'Search query is required').max(200),
    colors: mtgColors.optional(),
    types: z.array(mtgCardType).optional(),
    rarity: mtgRarity.optional(),
    set: mtgSetCode.optional(),
    format: mtgFormat.optional(),
    minCmc: commonSchemas.nonNegativeInt.optional(),
    maxCmc: commonSchemas.nonNegativeInt.optional(),
    page: commonSchemas.positiveInt.default(1),
    limit: z.number().int().min(1).max(100).default(20),
});
// Chat message
export const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
    context: z.object({
        deckId: commonSchemas.id.optional(),
        cardIds: z.array(commonSchemas.id).max(10).optional(),
        format: mtgFormat.optional(),
    }).optional(),
});
// ==================== VALIDATION MIDDLEWARE FACTORIES ====================
// Generic validation middleware
export const validateSchema = (schema) => {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
// Query parameter validation middleware
export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.query);
            req.query = validated;
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Query validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
// File validation middleware
export const validateFile = (schema) => {
    return (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'File is required' });
            }
            const validated = schema.parse(req.file);
            req.file = validated;
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'File validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
// Multiple files validation middleware
export const validateFiles = (schema) => {
    return (req, res, next) => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({ error: 'Files are required' });
            }
            const validated = z.array(schema).parse(req.files);
            req.files = validated;
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Files validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
// ==================== SANITIZATION UTILITIES ====================
// Sanitize HTML content
export const sanitizeHtml = (input) => {
    return validator.escape(input);
};
// Sanitize SQL input (basic)
export const sanitizeSql = (input) => {
    return input.replace(/['"\\;]/g, '');
};
// Sanitize filename
export const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
// Normalize MTG card name
export const normalizeMtgCardName = (cardName) => {
    return cardName
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"');
};
// ==================== CUSTOM VALIDATORS ====================
// Check if deck is legal for format
export const validateDeckLegality = (deck) => {
    const errors = [];
    // Basic deck size validation
    const mainDeckSize = deck.cards.filter(card => !card.isSideboard).length;
    const sideboardSize = deck.cards.filter(card => card.isSideboard).length;
    switch (deck.format) {
        case 'standard':
        case 'pioneer':
        case 'modern':
        case 'legacy':
        case 'vintage':
            if (mainDeckSize < 60) {
                errors.push('Constructed decks must have at least 60 cards in main deck');
            }
            if (sideboardSize > 15) {
                errors.push('Sideboard cannot exceed 15 cards');
            }
            break;
        case 'commander':
            if (mainDeckSize !== 100) {
                errors.push('Commander decks must have exactly 100 cards');
            }
            if (sideboardSize > 0) {
                errors.push('Commander decks cannot have a sideboard');
            }
            break;
    }
    return errors;
};
// Validate image dimensions
export const validateImageDimensions = (width, height) => {
    const errors = [];
    if (width < 50 || height < 50) {
        errors.push('Image dimensions must be at least 50x50 pixels');
    }
    if (width > 4000 || height > 4000) {
        errors.push('Image dimensions cannot exceed 4000x4000 pixels');
    }
    const aspectRatio = width / height;
    if (aspectRatio < 0.1 || aspectRatio > 10) {
        errors.push('Image aspect ratio must be between 0.1 and 10');
    }
    return errors;
};
// Export commonly used validation middleware
export const validators = {
    userRegistration: validateSchema(userRegistrationSchema),
    userLogin: validateSchema(userLoginSchema),
    deck: validateSchema(deckSchema),
    cardSearch: validateQuery(cardSearchSchema),
    chatMessage: validateSchema(chatMessageSchema),
    imageFile: validateFile(imageFileSchema),
    cardImageUpload: validateSchema(cardImageUploadSchema),
    drawing: validateSchema(drawingSchema),
};
//# sourceMappingURL=validation.js.map