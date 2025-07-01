# Azure Service Replacements Guide

This document provides comprehensive guidance for replacing AWS services with Azure equivalents as part of the DeckChatbot modernization initiative.

## Overview

This guide covers the migration from AWS services to Azure services, including specific code examples, configuration changes, and implementation strategies for each service replacement.

## Service Mapping

| AWS Service | Azure Service | Migration Complexity | Status |
|-------------|---------------|---------------------|---------|
| AWS Lambda | Azure Functions | Low | Optional |
| DynamoDB | Cosmos DB | Medium | Not Currently Used |
| S3 | Blob Storage | Low | Documentation Only |
| AWS OpenAI | Azure OpenAI Service | Low | ✅ Already Implemented |
| CloudWatch | Azure Monitor | Medium | Infrastructure Only |
| API Gateway | App Service | Low | Using Express.js |
| **AWS Rekognition** | **Azure Computer Vision** | **Medium** | **New Requirement** |

## 1. AWS Lambda → Azure Functions (Optional)

### Current State
The project currently uses Express.js applications running in containers rather than serverless functions.

### Migration Strategy
If serverless architecture is desired, Azure Functions can replace AWS Lambda.

#### Before (Hypothetical AWS Lambda)
```javascript
// AWS Lambda function
exports.handler = async (event, context) => {
  try {
    const { body } = event;
    const result = await processRequest(JSON.parse(body));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### After (Azure Functions)
```typescript
import { AzureFunction, Context, HttpRequest } from '@azure/functions';

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const result = await processRequest(req.body);
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: result
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: error.message }
    };
  }
};

export default httpTrigger;
```

#### Configuration
```json
// function.json
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

## 2. DynamoDB → Cosmos DB (Not Currently Used)

### Current State
The project doesn't currently use DynamoDB in the active codebase.

### Migration Strategy
If NoSQL database functionality is needed, Cosmos DB provides similar capabilities.

#### Before (AWS DynamoDB)
```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const putItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item
  };
  
  try {
    await dynamodb.put(params).promise();
    return { success: true };
  } catch (error) {
    throw new Error(`DynamoDB put failed: ${error.message}`);
  }
};

const getItem = async (tableName, key) => {
  const params = {
    TableName: tableName,
    Key: key
  };
  
  try {
    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    throw new Error(`DynamoDB get failed: ${error.message}`);
  }
};
```

#### After (Azure Cosmos DB)
```typescript
import { CosmosClient, Database, Container } from '@azure/cosmos';

class CosmosDBService {
  private client: CosmosClient;
  private database: Database;
  private container: Container;

  constructor() {
    this.client = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT!,
      key: process.env.COSMOS_DB_KEY!
    });
    this.database = this.client.database(process.env.COSMOS_DB_DATABASE!);
    this.container = this.database.container(process.env.COSMOS_DB_CONTAINER!);
  }

  async putItem(item: any): Promise<{ success: boolean }> {
    try {
      await this.container.items.create(item);
      return { success: true };
    } catch (error) {
      throw new Error(`Cosmos DB put failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getItem(id: string, partitionKey: string): Promise<any> {
    try {
      const { resource } = await this.container.item(id, partitionKey).read();
      return resource;
    } catch (error) {
      throw new Error(`Cosmos DB get failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async queryItems(query: string, parameters?: any[]): Promise<any[]> {
    try {
      const { resources } = await this.container.items.query({
        query,
        parameters
      }).fetchAll();
      return resources;
    } catch (error) {
      throw new Error(`Cosmos DB query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const cosmosDB = new CosmosDBService();
```

## 3. S3 → Blob Storage (Documentation Only)

### Current State
S3 is referenced in documentation but not actively used in the codebase.

### Migration Strategy
Replace S3 operations with Azure Blob Storage.

#### Before (AWS S3)
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const uploadFile = async (bucketName, key, body, contentType) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType
  };
  
  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

const downloadFile = async (bucketName, key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };
  
  try {
    const result = await s3.getObject(params).promise();
    return result.Body;
  } catch (error) {
    throw new Error(`S3 download failed: ${error.message}`);
  }
};
```

#### After (Azure Blob Storage)
```typescript
import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';

class BlobStorageService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
  }

  async uploadFile(
    containerName: string, 
    blobName: string, 
    data: Buffer | string, 
    contentType: string
  ): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.upload(data, data.length, {
        blobHTTPHeaders: {
          blobContentType: contentType
        }
      });
      
      return blockBlobClient.url;
    } catch (error) {
      throw new Error(`Blob upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(containerName: string, blobName: string): Promise<Buffer> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      const downloadResponse = await blockBlobClient.download();
      const chunks: Buffer[] = [];
      
      if (downloadResponse.readableStreamBody) {
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(chunk);
        }
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Blob download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(containerName: string, blobName: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.delete();
    } catch (error) {
      throw new Error(`Blob delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(containerName: string, prefix?: string): Promise<string[]> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobs: string[] = [];
      
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        blobs.push(blob.name);
      }
      
      return blobs;
    } catch (error) {
      throw new Error(`Blob list failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const blobStorage = new BlobStorageService();
```

## 4. AWS OpenAI → Azure OpenAI Service (Already Implemented)

### Current State
✅ **Already Implemented** - The project has a comprehensive Azure OpenAI service implementation.

### Current Implementation
The project already has `apps/backend/src/services/azure-openai.ts` with full functionality:

- Chat completions
- Streaming chat completions
- Embeddings
- Deck analysis
- Health checks

### Alternative: Ollama Integration (Already Implemented)

✅ **Already Implemented** - The project extensively uses Ollama as the default AI provider.

#### Current Ollama Implementation
```python
# apps/ai-service/ai_service/core.py
async def analyze_image_with_ollama(prompt: str, image_base64: str) -> str:
    """Analyze an image using Ollama."""
    try:
        response = await aiohttp.ClientSession().post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL_NAME,
                "prompt": prompt,
                "images": [image_base64],
                "stream": False
            }
        )
        # Process response...
        return result
    except Exception as e:
        raise Exception(f"Ollama image analysis error: {str(e)}")

async def chat_with_ollama(messages: List[Dict[str, Any]], options: Dict[str, Any] = {}) -> str:
    """Chat with Ollama."""
    # Implementation already exists...
```

#### Ollama Models Available
- `neural-chat`: Enhanced conversation
- `llama3.1:8b`: Fallback conversation model  
- `qwen2.5-vl`: Multimodal analysis
- `phi3:mini`: Reasoning tasks
- `llava-deckbot`: Custom deck analysis model

## 5. CloudWatch → Azure Monitor

### Current State
CloudWatch is used in AWS infrastructure for logging and monitoring.

### Migration Strategy
Replace CloudWatch with Azure Monitor for logging, metrics, and alerting.

#### Before (AWS CloudWatch Logs)
```javascript
const AWS = require('aws-sdk');
const cloudWatchLogs = new AWS.CloudWatchLogs();

const logEvent = async (logGroupName, logStreamName, message) => {
  const params = {
    logGroupName,
    logStreamName,
    logEvents: [{
      message: JSON.stringify(message),
      timestamp: Date.now()
    }]
  };
  
  try {
    await cloudWatchLogs.putLogEvents(params).promise();
  } catch (error) {
    console.error('CloudWatch logging failed:', error);
  }
};
```

#### After (Azure Monitor)
```typescript
import { LogsQueryClient, MetricsQueryClient } from '@azure/monitor-query';
import { DefaultAzureCredential } from '@azure/identity';

class AzureMonitorService {
  private logsClient: LogsQueryClient;
  private metricsClient: MetricsQueryClient;

  constructor() {
    const credential = new DefaultAzureCredential();
    this.logsClient = new LogsQueryClient(credential);
    this.metricsClient = new MetricsQueryClient(credential);
  }

  async logEvent(workspaceId: string, tableName: string, data: any): Promise<void> {
    try {
      // Azure Monitor uses Application Insights for custom logging
      // This would typically be done through Application Insights SDK
      console.log(`[${new Date().toISOString()}] ${tableName}:`, JSON.stringify(data));
    } catch (error) {
      console.error('Azure Monitor logging failed:', error);
    }
  }

  async queryLogs(workspaceId: string, query: string): Promise<any[]> {
    try {
      const result = await this.logsClient.queryWorkspace(
        workspaceId,
        query,
        { duration: 'PT1H' } // Last 1 hour
      );
      
      return result.tables[0]?.rows || [];
    } catch (error) {
      throw new Error(`Azure Monitor query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMetrics(resourceUri: string, metricNames: string[]): Promise<any> {
    try {
      const result = await this.metricsClient.queryResource(
        resourceUri,
        metricNames,
        {
          granularity: 'PT1M', // 1 minute granularity
          timespan: { duration: 'PT1H' } // Last 1 hour
        }
      );
      
      return result;
    } catch (error) {
      throw new Error(`Azure Monitor metrics query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const azureMonitor = new AzureMonitorService();
```

#### Application Insights Integration
```typescript
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

// Initialize Application Insights
ApplicationInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .start();

// Custom logging
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('deckchatbot');

export const logCustomEvent = (name: string, properties: any) => {
  const span = tracer.startSpan(name);
  span.setAttributes(properties);
  span.end();
};
```

## 6. API Gateway → App Service

### Current State
The project uses Express.js applications rather than API Gateway.

### Migration Strategy
Azure App Service can host the Express.js applications directly, providing similar functionality to API Gateway + Lambda.

#### Current Express.js Implementation (Already Optimal)
```typescript
// apps/backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting (API Gateway equivalent)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/deck', deckRouter);
app.use('/api/visualization', visualizationRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default app;
```

#### Azure App Service Configuration
```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: 'your-azure-subscription'
  appName: 'deckchatbot-backend'
  resourceGroupName: 'deckchatbot-rg'

stages:
- stage: Build
  jobs:
  - job: BuildApp
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    
    - script: |
        npm ci
        npm run build
      displayName: 'Build application'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'drop'

- stage: Deploy
  jobs:
  - deployment: DeployApp
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webAppLinux'
              appName: '$(appName)'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
              runtimeStack: 'NODE|18-lts'
```

## 7. AWS Rekognition → Azure Computer Vision (New Requirement)

### Implementation Strategy
Implement Azure Computer Vision for image analysis and OCR capabilities.

#### Azure Computer Vision Service
```typescript
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

class AzureComputerVisionService {
  private client: ComputerVisionClient;

  constructor() {
    const credentials = new ApiKeyCredentials({
      inHeader: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_COMPUTER_VISION_KEY!
      }
    });
    
    this.client = new ComputerVisionClient(
      credentials,
      process.env.AZURE_COMPUTER_VISION_ENDPOINT!
    );
  }

  async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    try {
      const analysis = await this.client.analyzeImageInStream(
        imageBuffer,
        {
          visualFeatures: [
            'Categories',
            'Description',
            'Objects',
            'Tags',
            'Adult',
            'Color',
            'Faces'
          ],
          details: ['Landmarks', 'Celebrities']
        }
      );

      return {
        description: analysis.description?.captions?.[0]?.text || '',
        tags: analysis.tags?.map(tag => tag.name || '') || [],
        objects: analysis.objects?.map(obj => ({
          name: obj.objectProperty || '',
          confidence: obj.confidence || 0,
          boundingBox: obj.rectangle
        })) || [],
        categories: analysis.categories?.map(cat => ({
          name: cat.name || '',
          score: cat.score || 0
        })) || [],
        faces: analysis.faces?.map(face => ({
          age: face.age || 0,
          gender: face.gender || 'unknown',
          boundingBox: face.faceRectangle
        })) || [],
        colors: {
          dominantColors: analysis.color?.dominantColors || [],
          accentColor: analysis.color?.accentColor || '',
          isBwImg: analysis.color?.isBWImg || false
        }
      };
    } catch (error) {
      throw new Error(`Computer Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractText(imageBuffer: Buffer): Promise<TextExtractionResult> {
    try {
      // Start OCR operation
      const ocrResult = await this.client.readInStream(imageBuffer);
      const operationId = ocrResult.operationLocation?.split('/').pop();

      if (!operationId) {
        throw new Error('Failed to get operation ID for OCR');
      }

      // Poll for results
      let result;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        result = await this.client.getReadResult(operationId);
      } while (result.status === 'running' || result.status === 'notStarted');

      if (result.status === 'failed') {
        throw new Error('OCR operation failed');
      }

      const textLines: TextLine[] = [];
      if (result.analyzeResult?.readResults) {
        for (const page of result.analyzeResult.readResults) {
          if (page.lines) {
            for (const line of page.lines) {
              textLines.push({
                text: line.text || '',
                boundingBox: line.boundingBox || [],
                words: line.words?.map(word => ({
                  text: word.text || '',
                  boundingBox: word.boundingBox || [],
                  confidence: word.confidence || 0
                })) || []
              });
            }
          }
        }
      }

      return {
        text: textLines.map(line => line.text).join('\n'),
        lines: textLines
      };
    } catch (error) {
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectObjects(imageBuffer: Buffer): Promise<ObjectDetectionResult[]> {
    try {
      const analysis = await this.client.analyzeImageInStream(
        imageBuffer,
        { visualFeatures: ['Objects'] }
      );

      return analysis.objects?.map(obj => ({
        name: obj.objectProperty || '',
        confidence: obj.confidence || 0,
        boundingBox: {
          x: obj.rectangle?.x || 0,
          y: obj.rectangle?.y || 0,
          width: obj.rectangle?.w || 0,
          height: obj.rectangle?.h || 0
        }
      })) || [];
    } catch (error) {
      throw new Error(`Object detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<{ status: string; endpoint: string }> {
    try {
      // Simple health check by analyzing a small test image
      const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      await this.client.analyzeImageInStream(testBuffer, { visualFeatures: ['Categories'] });
      
      return {
        status: 'healthy',
        endpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT || 'unknown'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        endpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT || 'unknown'
      };
    }
  }
}

// Type definitions
interface ImageAnalysisResult {
  description: string;
  tags: string[];
  objects: Array<{
    name: string;
    confidence: number;
    boundingBox?: any;
  }>;
  categories: Array<{
    name: string;
    score: number;
  }>;
  faces: Array<{
    age: number;
    gender: string;
    boundingBox?: any;
  }>;
  colors: {
    dominantColors: string[];
    accentColor: string;
    isBwImg: boolean;
  };
}

interface TextExtractionResult {
  text: string;
  lines: TextLine[];
}

interface TextLine {
  text: string;
  boundingBox: number[];
  words: Array<{
    text: string;
    boundingBox: number[];
    confidence: number;
  }>;
}

interface ObjectDetectionResult {
  name: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const azureComputerVision = new AzureComputerVisionService();
```

#### Integration with Existing Vision Router
```typescript
// apps/backend/src/routes/vision.ts
import { Router } from 'express';
import { azureComputerVision } from '../services/azure-computer-vision.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Analyze image endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const analysis = await azureComputerVision.analyzeImage(req.file.buffer);
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extract text endpoint
router.post('/extract-text', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const textResult = await azureComputerVision.extractText(req.file.buffer);
    
    res.json({
      success: true,
      data: textResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detect objects endpoint
router.post('/detect-objects', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const objects = await azureComputerVision.detectObjects(req.file.buffer);
    
    res.json({
      success: true,
      data: objects,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

## Configuration Updates

### Environment Variables
```bash
# .env.azure
# Azure Computer Vision
AZURE_COMPUTER_VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
AZURE_COMPUTER_VISION_KEY=your-computer-vision-key

# Azure Cosmos DB (if needed)
COSMOS_DB_ENDPOINT=https://your-cosmosdb.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmosdb-key
COSMOS_DB_DATABASE=deckchatbot
COSMOS_DB_CONTAINER=data

# Azure Blob Storage (if needed)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-storage;AccountKey=your-key;EndpointSuffix=core.windows.net

# Azure Monitor
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;IngestionEndpoint=https://your-region.in.applicationinsights.azure.com/

# Azure OpenAI (already configured)
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

### Package Dependencies
```json
{
  "dependencies": {
    "@azure/cognitiveservices-computervision": "^8.2.0",
    "@azure/cosmos": "^4.0.0",
    "@azure/storage-blob": "^12.17.0",
    "@azure/monitor-query": "^1.2.0",
    "@azure/monitor-opentelemetry": "^1.0.0",
    "@azure/functions": "^4.0.0",
    "@azure/identity": "^4.0.0",
    "@azure/ms-rest-js": "^2.7.0"
  }
}
```

## Migration Scripts

### Computer Vision Migration Script
```typescript
// scripts/migrate-to-computer-vision.ts
import { azureComputerVision } from '../apps/backend/src/services/azure-computer-vision.js';
import fs from 'fs/promises';
import path from 'path';

async function migrateImageAnalysis() {
  console.log('🔄 Migrating to Azure Computer Vision...');
  
  try {
    // Test Computer Vision service
    const healthCheck = await azureComputerVision.healthCheck();
    console.log('✅ Computer Vision service:', healthCheck.status);
    
    // Test with sample images if available
    const testImagesDir = './test-images';
    try {
      const files = await fs.readdir(testImagesDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|bmp)$/i.test(file)
      );
      
      for (const imageFile of imageFiles.slice(0, 3)) { // Test first 3 images
        console.log(`🖼️  Testing ${imageFile}...`);
        
        const imagePath = path.join(testImagesDir, imageFile);
        const imageBuffer = await fs.readFile(imagePath);
        
        const analysis = await azureComputerVision.analyzeImage(imageBuffer);
        console.log(`   Description: ${analysis.description}`);
        console.log(`   Tags: ${analysis.tags.slice(0, 5).join(', ')}`);
        
        const textResult = await azureComputerVision.extractText(imageBuffer);
        if (textResult.text) {
          console.log(`   Extracted text: ${textResult.text.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log('ℹ️  No test images found, skipping image tests');
    }
    
    console.log('✅ Azure Computer Vision migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateImageAnalysis().catch(console.error);
```

### Service Health Check Script
```typescript
// scripts/check-azure-services.ts
import { azureConfig } from '../apps/backend/src/services/azure-config.js';
import { azureComputerVision } from '../apps/backend/src/services/azure-computer-vision.js';

async function checkAzureServices() {
  console.log('🔍 Checking Azure services health...\n');
  
  const services = [
    {
      name: 'Azure OpenAI',
      check: async () => {
        // Use existing health check from azure-openai.ts
        return { status: 'healthy' }; // Placeholder
      }
    },
    {
      name: 'Azure Computer Vision',
      check: () => azureComputerVision.healthCheck()
    }
  ];
  
  for (const service of services) {
    try {
      console.log(`Checking ${service.name}...`);
      const result = await service.check();
      console.log(`✅ ${service.name}: ${result.status}`);
    } catch (error) {
      console.log(`❌ ${service.name}: failed`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log('');
  }
}

checkAzureServices().catch(console.error);
```

## Implementation Checklist

### Phase 1: Core Services (Already Complete)
- [x] Azure OpenAI Service implementation
- [x] Ollama integration
- [x] Azure configuration management

### Phase 2: Computer Vision (New)
- [ ] Install Azure Computer Vision SDK
- [ ] Implement AzureComputerVisionService class
- [ ] Create vision analysis endpoints
- [ ] Add OCR capabilities
- [ ] Implement object detection
- [ ] Add health checks

### Phase 3: Optional Services
- [ ] Cosmos DB implementation (if NoSQL needed)
- [ ] Blob Storage implementation (if file storage needed)
- [ ] Azure Monitor integration
- [ ] Azure Functions migration (if serverless needed)

### Phase 4: Testing & Validation
- [ ] Unit tests for Computer Vision service
- [ ] Integration tests for all Azure services
- [ ] Performance comparison with existing services
- [ ] Error handling validation

### Phase 5: Documentation & Training
- [ ] Update API documentation
- [ ] Create service migration guides
- [ ] Update deployment documentation
- [ ] Team training on new services

## Cost Considerations

| Service | Estimated Monthly Cost | Usage Pattern |
|---------|----------------------|---------------|
| Azure Computer Vision | $10-50 | Per 1,000 transactions |
| Azure OpenAI | $20-100 | Per token usage |
| Cosmos DB | $25-200 | If implemented |
| Blob Storage | $5-25 | If implemented |
| Azure Monitor | $10-50 | Logging and metrics |
| **Total** | **$70-425** | **Depending on usage** |

## Monitoring & Alerting

### Azure Monitor Alerts
```json
{
  "alertRules": [
    {
      "name": "Computer Vision High Error Rate",
      "condition": "Computer Vision API errors > 10% in 5 minutes",
      "action": "Send notification to ops team"
    },
    {
      "name": "High Response Time",
      "condition": "Average response time > 2 seconds for 5 minutes",
      "action": "Scale up resources"
    },
    {
      "name": "Service Unavailable",
      "condition": "Health check failures > 3 in 5 minutes",
      "action": "Immediate escalation"
    }
  ]
}
```

## Rollback Strategy

### Service Rollback Plan
1. **Computer Vision**: Keep ollama as fallback
2. **OpenAI**: Already has ollama fallback implemented
3. **Storage**: Implement dual-write pattern during migration
4. **Monitoring**: Maintain existing logging during transition

### Feature Flags
```typescript
// Feature flag configuration
const featureFlags = {
  useAzureComputerVision: process.env.FEATURE_AZURE_COMPUTER_VISION === 'true',
  useAzureOpenAI: process.env.FEATURE_AZURE_OPENAI === 'true',
  useOllamaFallback: process.env.FEATURE_OLLAMA_FALLBACK !== 'false'
};

// Service selection logic
const getVisionService = () => {
  if (featureFlags.useAzureComputerVision) {
    return azureComputerVision;
  }
  return ollamaVisionService; // Fallback
};
```

## Conclusion

This migration guide provides a comprehensive approach to replacing AWS services with Azure equivalents. The project already has strong Azure OpenAI and ollama integrations, making the transition primarily focused on adding Azure Computer Vision capabilities.

Key benefits of this migration:
- **Unified Cloud Provider**: All services under Azure
- **Better Integration**: Native Azure service integration
- **Cost Optimization**: Potential cost savings with Azure pricing
- **Enhanced Capabilities**: Azure Computer Vision offers advanced features
- **Flexibility**: Ollama provides local AI alternative

The migration can be implemented incrementally with proper fallback mechanisms to ensure service continuity.
