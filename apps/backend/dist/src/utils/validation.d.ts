import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const commonSchemas: {
    id: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    url: z.ZodString;
    positiveInt: z.ZodNumber;
    nonNegativeInt: z.ZodNumber;
    timestamp: z.ZodString;
    slug: z.ZodString;
};
export declare const mtgCardName: z.ZodString;
export declare const mtgManaCost: z.ZodOptional<z.ZodString>;
export declare const mtgColor: z.ZodEnum<["W", "U", "B", "R", "G", "C"]>;
export declare const mtgColors: z.ZodArray<z.ZodEnum<["W", "U", "B", "R", "G", "C"]>, "many">;
export declare const mtgCardType: z.ZodEnum<["Artifact", "Creature", "Enchantment", "Instant", "Land", "Planeswalker", "Sorcery", "Tribal", "Battle"]>;
export declare const mtgRarity: z.ZodEnum<["common", "uncommon", "rare", "mythic"]>;
export declare const mtgSetCode: z.ZodString;
export declare const mtgFormat: z.ZodEnum<["standard", "pioneer", "modern", "legacy", "vintage", "commander", "pauper", "historic", "alchemy"]>;
export declare const deckCardSchema: z.ZodObject<{
    cardId: z.ZodString;
    cardName: z.ZodString;
    quantity: z.ZodNumber;
    isSideboard: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    cardId: string;
    cardName: string;
    isSideboard: boolean;
}, {
    quantity: number;
    cardId: string;
    cardName: string;
    isSideboard?: boolean | undefined;
}>;
export declare const deckSchema: z.ZodObject<{
    name: z.ZodString;
    format: z.ZodEnum<["standard", "pioneer", "modern", "legacy", "vintage", "commander", "pauper", "historic", "alchemy"]>;
    description: z.ZodOptional<z.ZodString>;
    cards: z.ZodArray<z.ZodObject<{
        cardId: z.ZodString;
        cardName: z.ZodString;
        quantity: z.ZodNumber;
        isSideboard: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        cardId: string;
        cardName: string;
        isSideboard: boolean;
    }, {
        quantity: number;
        cardId: string;
        cardName: string;
        isSideboard?: boolean | undefined;
    }>, "many">;
    colors: z.ZodOptional<z.ZodArray<z.ZodEnum<["W", "U", "B", "R", "G", "C"]>, "many">>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    format: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy";
    isPublic: boolean;
    cards: {
        quantity: number;
        cardId: string;
        cardName: string;
        isSideboard: boolean;
    }[];
    description?: string | undefined;
    colors?: ("W" | "U" | "B" | "R" | "G" | "C")[] | undefined;
}, {
    name: string;
    format: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy";
    cards: {
        quantity: number;
        cardId: string;
        cardName: string;
        isSideboard?: boolean | undefined;
    }[];
    description?: string | undefined;
    isPublic?: boolean | undefined;
    colors?: ("W" | "U" | "B" | "R" | "G" | "C")[] | undefined;
}>;
export declare const imageFileSchema: z.ZodObject<{
    fieldname: z.ZodString;
    originalname: z.ZodString;
    encoding: z.ZodString;
    mimetype: z.ZodEnum<["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"]>;
    size: z.ZodNumber;
    buffer: z.ZodType<Buffer<ArrayBufferLike>, z.ZodTypeDef, Buffer<ArrayBufferLike>>;
}, "strip", z.ZodTypeAny, {
    originalname: string;
    mimetype: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/bmp" | "image/tiff" | "image/jpg";
    size: number;
    encoding: string;
    fieldname: string;
    buffer: Buffer<ArrayBufferLike>;
}, {
    originalname: string;
    mimetype: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/bmp" | "image/tiff" | "image/jpg";
    size: number;
    encoding: string;
    fieldname: string;
    buffer: Buffer<ArrayBufferLike>;
}>;
export declare const imageProcessingSchema: z.ZodObject<{
    resize: z.ZodOptional<z.ZodObject<{
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        maintainAspectRatio: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maintainAspectRatio: boolean;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        width?: number | undefined;
        height?: number | undefined;
        maintainAspectRatio?: boolean | undefined;
    }>>;
    quality: z.ZodDefault<z.ZodNumber>;
    format: z.ZodDefault<z.ZodEnum<["jpeg", "png", "webp"]>>;
    optimize: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    format: "png" | "webp" | "jpeg";
    quality: number;
    optimize: boolean;
    resize?: {
        maintainAspectRatio: boolean;
        width?: number | undefined;
        height?: number | undefined;
    } | undefined;
}, {
    format?: "png" | "webp" | "jpeg" | undefined;
    quality?: number | undefined;
    resize?: {
        width?: number | undefined;
        height?: number | undefined;
        maintainAspectRatio?: boolean | undefined;
    } | undefined;
    optimize?: boolean | undefined;
}>;
export declare const cardImageUploadSchema: z.ZodObject<{
    cardId: z.ZodOptional<z.ZodString>;
    cardName: z.ZodOptional<z.ZodString>;
    setCode: z.ZodOptional<z.ZodString>;
    imageType: z.ZodDefault<z.ZodEnum<["card", "art", "symbol"]>>;
    processing: z.ZodOptional<z.ZodObject<{
        resize: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            maintainAspectRatio: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            maintainAspectRatio: boolean;
            width?: number | undefined;
            height?: number | undefined;
        }, {
            width?: number | undefined;
            height?: number | undefined;
            maintainAspectRatio?: boolean | undefined;
        }>>;
        quality: z.ZodDefault<z.ZodNumber>;
        format: z.ZodDefault<z.ZodEnum<["jpeg", "png", "webp"]>>;
        optimize: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        format: "png" | "webp" | "jpeg";
        quality: number;
        optimize: boolean;
        resize?: {
            maintainAspectRatio: boolean;
            width?: number | undefined;
            height?: number | undefined;
        } | undefined;
    }, {
        format?: "png" | "webp" | "jpeg" | undefined;
        quality?: number | undefined;
        resize?: {
            width?: number | undefined;
            height?: number | undefined;
            maintainAspectRatio?: boolean | undefined;
        } | undefined;
        optimize?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    imageType: "symbol" | "card" | "art";
    processing?: {
        format: "png" | "webp" | "jpeg";
        quality: number;
        optimize: boolean;
        resize?: {
            maintainAspectRatio: boolean;
            width?: number | undefined;
            height?: number | undefined;
        } | undefined;
    } | undefined;
    cardId?: string | undefined;
    cardName?: string | undefined;
    setCode?: string | undefined;
}, {
    processing?: {
        format?: "png" | "webp" | "jpeg" | undefined;
        quality?: number | undefined;
        resize?: {
            width?: number | undefined;
            height?: number | undefined;
            maintainAspectRatio?: boolean | undefined;
        } | undefined;
        optimize?: boolean | undefined;
    } | undefined;
    cardId?: string | undefined;
    cardName?: string | undefined;
    setCode?: string | undefined;
    imageType?: "symbol" | "card" | "art" | undefined;
}>;
export declare const coordinateSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
}, {
    x: number;
    y: number;
}>;
export declare const strokeSchema: z.ZodObject<{
    points: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>, "many">;
    color: z.ZodString;
    width: z.ZodNumber;
    opacity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    width: number;
    opacity: number;
    points: {
        x: number;
        y: number;
    }[];
    color: string;
}, {
    width: number;
    points: {
        x: number;
        y: number;
    }[];
    color: string;
    opacity?: number | undefined;
}>;
export declare const drawingLayerSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    strokes: z.ZodArray<z.ZodObject<{
        points: z.ZodArray<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>, "many">;
        color: z.ZodString;
        width: z.ZodNumber;
        opacity: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        width: number;
        opacity: number;
        points: {
            x: number;
            y: number;
        }[];
        color: string;
    }, {
        width: number;
        points: {
            x: number;
            y: number;
        }[];
        color: string;
        opacity?: number | undefined;
    }>, "many">;
    visible: z.ZodDefault<z.ZodBoolean>;
    locked: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    strokes: {
        width: number;
        opacity: number;
        points: {
            x: number;
            y: number;
        }[];
        color: string;
    }[];
    visible: boolean;
    locked: boolean;
}, {
    id: string;
    name: string;
    strokes: {
        width: number;
        points: {
            x: number;
            y: number;
        }[];
        color: string;
        opacity?: number | undefined;
    }[];
    visible?: boolean | undefined;
    locked?: boolean | undefined;
}>;
export declare const drawingSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    canvas: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        backgroundColor: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        width: number;
        height: number;
        backgroundColor: string;
    }, {
        width: number;
        height: number;
        backgroundColor?: string | undefined;
    }>;
    layers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        strokes: z.ZodArray<z.ZodObject<{
            points: z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x: number;
                y: number;
            }, {
                x: number;
                y: number;
            }>, "many">;
            color: z.ZodString;
            width: z.ZodNumber;
            opacity: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            width: number;
            opacity: number;
            points: {
                x: number;
                y: number;
            }[];
            color: string;
        }, {
            width: number;
            points: {
                x: number;
                y: number;
            }[];
            color: string;
            opacity?: number | undefined;
        }>, "many">;
        visible: z.ZodDefault<z.ZodBoolean>;
        locked: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        strokes: {
            width: number;
            opacity: number;
            points: {
                x: number;
                y: number;
            }[];
            color: string;
        }[];
        visible: boolean;
        locked: boolean;
    }, {
        id: string;
        name: string;
        strokes: {
            width: number;
            points: {
                x: number;
                y: number;
            }[];
            color: string;
            opacity?: number | undefined;
        }[];
        visible?: boolean | undefined;
        locked?: boolean | undefined;
    }>, "many">;
    tags: z.ZodArray<z.ZodString, "many">;
    isPublic: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tags: string[];
    isPublic: boolean;
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
    };
    layers: {
        id: string;
        name: string;
        strokes: {
            width: number;
            opacity: number;
            points: {
                x: number;
                y: number;
            }[];
            color: string;
        }[];
        visible: boolean;
        locked: boolean;
    }[];
    id?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    tags: string[];
    canvas: {
        width: number;
        height: number;
        backgroundColor?: string | undefined;
    };
    layers: {
        id: string;
        name: string;
        strokes: {
            width: number;
            points: {
                x: number;
                y: number;
            }[];
            color: string;
            opacity?: number | undefined;
        }[];
        visible?: boolean | undefined;
        locked?: boolean | undefined;
    }[];
    id?: string | undefined;
    description?: string | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const userRegistrationSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email: string;
    username: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>;
export declare const userLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const cardSearchSchema: z.ZodObject<{
    query: z.ZodString;
    colors: z.ZodOptional<z.ZodArray<z.ZodEnum<["W", "U", "B", "R", "G", "C"]>, "many">>;
    types: z.ZodOptional<z.ZodArray<z.ZodEnum<["Artifact", "Creature", "Enchantment", "Instant", "Land", "Planeswalker", "Sorcery", "Tribal", "Battle"]>, "many">>;
    rarity: z.ZodOptional<z.ZodEnum<["common", "uncommon", "rare", "mythic"]>>;
    set: z.ZodOptional<z.ZodString>;
    format: z.ZodOptional<z.ZodEnum<["standard", "pioneer", "modern", "legacy", "vintage", "commander", "pauper", "historic", "alchemy"]>>;
    minCmc: z.ZodOptional<z.ZodNumber>;
    maxCmc: z.ZodOptional<z.ZodNumber>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    page: number;
    format?: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy" | undefined;
    rarity?: "common" | "uncommon" | "rare" | "mythic" | undefined;
    set?: string | undefined;
    colors?: ("W" | "U" | "B" | "R" | "G" | "C")[] | undefined;
    types?: ("Artifact" | "Creature" | "Enchantment" | "Instant" | "Land" | "Planeswalker" | "Sorcery" | "Tribal" | "Battle")[] | undefined;
    minCmc?: number | undefined;
    maxCmc?: number | undefined;
}, {
    query: string;
    limit?: number | undefined;
    format?: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy" | undefined;
    rarity?: "common" | "uncommon" | "rare" | "mythic" | undefined;
    set?: string | undefined;
    colors?: ("W" | "U" | "B" | "R" | "G" | "C")[] | undefined;
    types?: ("Artifact" | "Creature" | "Enchantment" | "Instant" | "Land" | "Planeswalker" | "Sorcery" | "Tribal" | "Battle")[] | undefined;
    minCmc?: number | undefined;
    maxCmc?: number | undefined;
    page?: number | undefined;
}>;
export declare const chatMessageSchema: z.ZodObject<{
    message: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        deckId: z.ZodOptional<z.ZodString>;
        cardIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        format: z.ZodOptional<z.ZodEnum<["standard", "pioneer", "modern", "legacy", "vintage", "commander", "pauper", "historic", "alchemy"]>>;
    }, "strip", z.ZodTypeAny, {
        format?: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy" | undefined;
        deckId?: string | undefined;
        cardIds?: string[] | undefined;
    }, {
        format?: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy" | undefined;
        deckId?: string | undefined;
        cardIds?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    context?: {
        format?: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy" | undefined;
        deckId?: string | undefined;
        cardIds?: string[] | undefined;
    } | undefined;
}, {
    message: string;
    context?: {
        format?: "standard" | "commander" | "modern" | "pioneer" | "legacy" | "vintage" | "pauper" | "historic" | "alchemy" | undefined;
        deckId?: string | undefined;
        cardIds?: string[] | undefined;
    } | undefined;
}>;
export declare const validateSchema: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateQuery: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateFile: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateFiles: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sanitizeHtml: (input: string) => string;
export declare const sanitizeSql: (input: string) => string;
export declare const sanitizeFilename: (filename: string) => string;
export declare const normalizeMtgCardName: (cardName: string) => string;
export declare const validateDeckLegality: (deck: z.infer<typeof deckSchema>) => string[];
export declare const validateImageDimensions: (width: number, height: number) => string[];
export declare const validators: {
    userRegistration: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    userLogin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    deck: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    cardSearch: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    chatMessage: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    imageFile: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    cardImageUpload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    drawing: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
};
//# sourceMappingURL=validation.d.ts.map