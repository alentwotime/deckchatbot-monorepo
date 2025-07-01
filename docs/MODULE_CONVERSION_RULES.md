# Module Conversion Rules

This document provides comprehensive guidelines for converting existing code to modern ES modules and migrating from AWS SDK to Azure SDK.

## Overview

When modernizing the codebase, follow these 8 essential conversion rules:

1. Replace `require()` with `import`
2. Replace `module.exports` with `export`
3. Add `.js` extensions to TypeScript imports
4. Use relative paths from workspace root
5. Add proper TypeScript types
6. Convert AWS SDK calls to Azure SDK calls
7. Update error handling patterns
8. Add input validation

## Rule 1: Replace `require()` with `import`

### Before (CommonJS)
```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');
const { validationResult } = require('express-validator');
const logger = require('../src/utils/logger');
```

### After (ES Modules)
```javascript
import express from 'express';
import path from 'path';
import cors from 'cors';
import { validationResult } from 'express-validator';
import logger from '../src/utils/logger.js';
```

### Special Cases

#### Dynamic Imports
```javascript
// Before
const config = require('./config');

// After
const config = await import('./config.js');
```

#### Conditional Requires
```javascript
// Before
if (process.env.NODE_ENV === 'development') {
  const devTools = require('./dev-tools');
}

// After
if (process.env.NODE_ENV === 'development') {
  const { default: devTools } = await import('./dev-tools.js');
}
```

## Rule 2: Replace `module.exports` with `export`

### Before (CommonJS)
```javascript
// Single export
module.exports = { calculateDeckMaterials };

// Multiple exports
module.exports = {
  extractNumbers,
  parseMeasurement,
  validateInput
};

// Default export
module.exports = router;
```

### After (ES Modules)
```javascript
// Single export
export { calculateDeckMaterials };

// Multiple exports
export {
  extractNumbers,
  parseMeasurement,
  validateInput
};

// Default export
export default router;
```

### Mixed Exports
```javascript
// Before
const defaultFunction = () => {};
const helperFunction = () => {};
module.exports = defaultFunction;
module.exports.helper = helperFunction;

// After
const defaultFunction = () => {};
const helperFunction = () => {};
export default defaultFunction;
export { helperFunction as helper };
```

## Rule 3: Add `.js` Extensions to TypeScript Imports

### Before
```typescript
import { UserService } from './services/user-service';
import { validateInput } from '../utils/validation';
import config from './config';
```

### After
```typescript
import { UserService } from './services/user-service.js';
import { validateInput } from '../utils/validation.js';
import config from './config.js';
```

### Note
- Always add `.js` extension even for `.ts` files
- This is required for proper ES module resolution
- TypeScript compiler will handle the actual file resolution

## Rule 4: Use Relative Paths from Workspace Root

### Before (Inconsistent paths)
```javascript
// From apps/frontend/controllers/measurementController.js
const { addMeasurement } = require('../memory');
const { polygonArea } = require('../src/utils/geometry');

// From tests/__tests__/measurements.test.js
const { app } = require('../server.cjs');
const memory = require('../frontend/memory');
```

### After (Consistent workspace-relative paths)
```javascript
// From apps/frontend/controllers/measurementController.js
import { addMeasurement } from '../../shared/memory/index.js';
import { polygonArea } from '../../shared/utils/geometry.js';

// From tests/__tests__/measurements.test.js
import { app } from '../apps/frontend/server.js';
import memory from '../shared/memory/index.js';
```

### Path Mapping Strategy
```
workspace-root/
├── apps/
│   ├── frontend/
│   ├── backend/
│   └── ai-service/
├── shared/
│   ├── utils/
│   ├── types/
│   └── services/
└── tests/
```

## Rule 5: Add Proper TypeScript Types

### Before (Untyped JavaScript)
```javascript
const calculateSteps = (height, stepHeight) => {
  return Math.ceil(height / stepHeight);
};

const processImage = async (file, options) => {
  // Process image
  return result;
};
```

### After (Typed TypeScript)
```typescript
interface StepCalculationOptions {
  height: number;
  stepHeight: number;
  includeRiser?: boolean;
}

interface ImageProcessingOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  resize?: {
    width: number;
    height: number;
  };
}

interface ProcessedImageResult {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
  };
}

const calculateSteps = (options: StepCalculationOptions): number => {
  const { height, stepHeight } = options;
  return Math.ceil(height / stepHeight);
};

const processImage = async (
  file: Express.Multer.File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> => {
  // Process image with proper typing
  return result;
};
```

### Common Type Patterns
```typescript
// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Configuration types
interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
  };
  azure: {
    subscriptionId: string;
    resourceGroup: string;
    region: string;
  };
}

// Error types
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Rule 6: Convert AWS SDK calls to Azure SDK calls

### Before (AWS SDK)
```javascript
const AWS = require('aws-sdk');

// S3 Operations
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const uploadFile = async (file, key) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: 'image/jpeg'
  };
  
  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Rekognition (Computer Vision)
const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION
});

const analyzeImage = async (imageBuffer) => {
  const params = {
    Image: {
      Bytes: imageBuffer
    },
    Features: ['LABELS', 'TEXT']
  };
  
  const result = await rekognition.detectLabels(params).promise();
  return result.Labels;
};
```

### After (Azure SDK)
```typescript
import { BlobServiceClient } from '@azure/storage-blob';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

// Blob Storage Operations
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

const uploadFile = async (file: Buffer, fileName: string): Promise<string> => {
  try {
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_CONTAINER_NAME!
    );
    
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    await blockBlobClient.upload(file, file.length, {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg'
      }
    });
    
    return blockBlobClient.url;
  } catch (error) {
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Computer Vision
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({
    inHeader: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_COMPUTER_VISION_KEY!
    }
  }),
  process.env.AZURE_COMPUTER_VISION_ENDPOINT!
);

interface AnalysisResult {
  labels: string[];
  text: string[];
}

const analyzeImage = async (imageBuffer: Buffer): Promise<AnalysisResult> => {
  try {
    const analysis = await computerVisionClient.analyzeImageInStream(
      imageBuffer,
      {
        visualFeatures: ['Categories', 'Description', 'Objects'],
        details: ['Landmarks']
      }
    );
    
    const labels = analysis.description?.tags || [];
    const text = analysis.description?.captions?.map(c => c.text || '') || [];
    
    return { labels, text };
  } catch (error) {
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
```

### Service Mapping Table

| AWS Service | Azure Service | SDK Package |
|-------------|---------------|-------------|
| S3 | Blob Storage | `@azure/storage-blob` |
| Rekognition | Computer Vision | `@azure/cognitiveservices-computervision` |
| Lambda | Functions | `@azure/functions` |
| DynamoDB | Cosmos DB | `@azure/cosmos` |
| SQS | Service Bus | `@azure/service-bus` |
| SNS | Event Grid | `@azure/eventgrid` |
| CloudWatch | Monitor | `@azure/monitor-query` |
| Systems Manager | Key Vault | `@azure/keyvault-secrets` |

## Rule 7: Update Error Handling Patterns

### Before (Basic error handling)
```javascript
const processRequest = async (req, res) => {
  try {
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
```

### After (Comprehensive error handling)
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Custom error classes
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Error handler middleware
const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with context
  logger.error('Request failed', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: {
        field: error.field,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
    return;
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.id
  });
};

// Async wrapper for better error handling
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Updated request handler
const processRequest = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await someAsyncOperation();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new ServiceError(`Processing failed: ${error.message}`, 500, 'PROCESSING_ERROR');
    }
    throw new ServiceError('Unknown processing error', 500, 'UNKNOWN_ERROR');
  }
});
```

## Rule 8: Add Input Validation

### Before (No validation)
```javascript
const calculateSkirting = (req, res) => {
  const { measurements, skirtingHeight } = req.body;
  
  const result = measurements.map(m => ({
    length: m.length * skirtingHeight,
    cost: m.length * skirtingHeight * 2.5
  }));
  
  res.json(result);
};
```

### After (Comprehensive validation)
```typescript
import { z } from 'zod';
import { Request, Response } from 'express';

// Validation schemas
const MeasurementSchema = z.object({
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive').optional(),
  unit: z.enum(['ft', 'in', 'm', 'cm']).default('ft')
});

const SkirtingCalculationSchema = z.object({
  measurements: z.array(MeasurementSchema).min(1, 'At least one measurement required'),
  skirtingHeight: z.number().positive('Skirting height must be positive'),
  pricePerUnit: z.number().positive('Price per unit must be positive').default(2.5),
  includeWaste: z.boolean().default(true),
  wastePercentage: z.number().min(0).max(50).default(10)
});

// Validation middleware
const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
        return;
      }
      next(error);
    }
  };
};

// Updated handler with validation
const calculateSkirting = asyncHandler(async (req: Request, res: Response) => {
  // Input is already validated by middleware
  const { measurements, skirtingHeight, pricePerUnit, includeWaste, wastePercentage } = req.body;
  
  const results = measurements.map((measurement: any) => {
    let totalLength = measurement.length;
    
    // Convert units if necessary
    if (measurement.unit !== 'ft') {
      totalLength = convertToFeet(totalLength, measurement.unit);
    }
    
    // Calculate material needed
    let materialNeeded = totalLength * skirtingHeight;
    
    // Add waste if requested
    if (includeWaste) {
      materialNeeded *= (1 + wastePercentage / 100);
    }
    
    return {
      originalLength: measurement.length,
      unit: measurement.unit,
      materialNeeded: Math.ceil(materialNeeded * 100) / 100, // Round to 2 decimals
      cost: Math.ceil(materialNeeded * pricePerUnit * 100) / 100
    };
  });
  
  const totalCost = results.reduce((sum, result) => sum + result.cost, 0);
  const totalMaterial = results.reduce((sum, result) => sum + result.materialNeeded, 0);
  
  res.json({
    success: true,
    data: {
      calculations: results,
      summary: {
        totalMaterial: Math.ceil(totalMaterial * 100) / 100,
        totalCost: Math.ceil(totalCost * 100) / 100,
        wasteIncluded: includeWaste,
        wastePercentage: includeWaste ? wastePercentage : 0
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Helper function
const convertToFeet = (value: number, fromUnit: string): number => {
  const conversions: Record<string, number> = {
    'in': 1/12,
    'm': 3.28084,
    'cm': 0.0328084,
    'ft': 1
  };
  
  return value * (conversions[fromUnit] || 1);
};

// Route with validation middleware
app.post('/api/calculate-skirting', 
  validateRequest(SkirtingCalculationSchema),
  calculateSkirting
);
```

## Implementation Checklist

### Phase 1: Module System Conversion
- [ ] Convert all `require()` statements to `import`
- [ ] Convert all `module.exports` to `export`
- [ ] Add `.js` extensions to all imports
- [ ] Update package.json with `"type": "module"`
- [ ] Fix any dynamic require() calls

### Phase 2: Path Standardization
- [ ] Audit all import paths
- [ ] Create shared utilities in `/shared` directory
- [ ] Update all imports to use workspace-relative paths
- [ ] Create path mapping in tsconfig.json

### Phase 3: TypeScript Migration
- [ ] Add TypeScript types to all functions
- [ ] Create interface definitions for data structures
- [ ] Add proper error type definitions
- [ ] Configure strict TypeScript settings

### Phase 4: Azure SDK Migration
- [ ] Audit all AWS SDK usage
- [ ] Install equivalent Azure SDK packages
- [ ] Convert AWS service calls to Azure equivalents
- [ ] Update configuration for Azure services
- [ ] Test all Azure integrations

### Phase 5: Error Handling & Validation
- [ ] Implement comprehensive error handling
- [ ] Add input validation to all endpoints
- [ ] Create custom error classes
- [ ] Add proper logging with context
- [ ] Implement error recovery strategies

## Testing Strategy

### Unit Tests
```typescript
// Before
const { calculateSteps } = require("../frontend/src/utils/geometry");

// After
import { calculateSteps } from '../shared/utils/geometry.js';
import { describe, it, expect } from 'vitest';

describe('calculateSteps', () => {
  it('should calculate steps correctly with valid input', () => {
    const result = calculateSteps({
      height: 24,
      stepHeight: 8,
      includeRiser: true
    });
    
    expect(result).toBe(3);
  });
  
  it('should throw validation error for invalid input', () => {
    expect(() => calculateSteps({
      height: -1,
      stepHeight: 8
    })).toThrow('Height must be positive');
  });
});
```

### Integration Tests
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../apps/frontend/server.js';

describe('API Endpoints', () => {
  it('should validate input and return proper error', async () => {
    const response = await request(app)
      .post('/api/calculate-skirting')
      .send({
        measurements: [], // Invalid: empty array
        skirtingHeight: -1 // Invalid: negative number
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.details).toHaveLength(2);
  });
});
```

## Migration Tools

### Automated Conversion Script
```bash
#!/bin/bash
# convert-modules.sh

echo "Converting CommonJS to ES Modules..."

# Find and convert require statements
find . -name "*.js" -not -path "./node_modules/*" -exec sed -i 's/const \(.*\) = require(\(.*\))/import \1 from \2/g' {} \;

# Find and convert module.exports
find . -name "*.js" -not -path "./node_modules/*" -exec sed -i 's/module\.exports = \(.*\)/export default \1/g' {} \;

# Add .js extensions (requires manual review)
echo "Manual step: Add .js extensions to all import statements"

echo "Conversion complete. Please review changes manually."
```

### Validation Script
```typescript
// validate-conversion.ts
import { glob } from 'glob';
import { readFile } from 'fs/promises';

const validateConversion = async () => {
  const files = await glob('**/*.{js,ts}', { ignore: 'node_modules/**' });
  
  const issues: string[] = [];
  
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    
    // Check for remaining CommonJS patterns
    if (content.includes('require(')) {
      issues.push(`${file}: Still contains require() statements`);
    }
    
    if (content.includes('module.exports')) {
      issues.push(`${file}: Still contains module.exports`);
    }
    
    // Check for missing .js extensions
    const importMatches = content.match(/import.*from\s+['"]\..*['"]/g);
    if (importMatches) {
      for (const match of importMatches) {
        if (!match.includes('.js') && !match.includes('.json')) {
          issues.push(`${file}: Missing .js extension in: ${match}`);
        }
      }
    }
  }
  
  if (issues.length > 0) {
    console.log('Conversion issues found:');
    issues.forEach(issue => console.log(`- ${issue}`));
    process.exit(1);
  } else {
    console.log('✅ All files successfully converted!');
  }
};

validateConversion().catch(console.error);
```

## Best Practices

1. **Incremental Migration**: Convert modules one at a time to avoid breaking the entire application
2. **Test Coverage**: Ensure comprehensive tests before and after conversion
3. **Type Safety**: Use strict TypeScript settings to catch conversion issues
4. **Error Boundaries**: Implement proper error handling at module boundaries
5. **Documentation**: Update all documentation to reflect new module structure
6. **Performance**: Monitor performance impact of module changes
7. **Backwards Compatibility**: Consider maintaining compatibility layers during transition

## Common Pitfalls

1. **Circular Dependencies**: ES modules are stricter about circular dependencies
2. **Dynamic Imports**: `require()` in conditionals needs special handling
3. **JSON Imports**: JSON files need explicit import assertions
4. **Path Resolution**: ES modules require explicit file extensions
5. **Top-level Await**: Only available in ES modules, not CommonJS
6. **Default Exports**: Mixing default and named exports can cause confusion

## Resources

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Azure SDK for JavaScript](https://docs.microsoft.com/en-us/javascript/api/overview/azure/)
- [Zod Validation Library](https://zod.dev/)
- [Vitest Testing Framework](https://vitest.dev/)
