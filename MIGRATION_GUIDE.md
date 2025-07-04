# AWS to Azure Migration Guide

This comprehensive guide provides step-by-step instructions for migrating DeckChatbot from AWS to Azure, including service mappings, code transformations, data migration procedures, and validation checklists.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Service Mapping Table](#service-mapping-table)
3. [Pre-Migration Planning](#pre-migration-planning)
4. [Step-by-Step Migration Process](#step-by-step-migration-process)
5. [Code Transformation Examples](#code-transformation-examples)
6. [Data Migration Procedures](#data-migration-procedures)
7. [Configuration Changes](#configuration-changes)
8. [Testing and Validation](#testing-and-validation)
9. [Post-Migration Optimization](#post-migration-optimization)
10. [Troubleshooting Migration Issues](#troubleshooting-migration-issues)
11. [Validation Checklist](#validation-checklist)

## Migration Overview

### Why Migrate to Azure?

- **Cost Efficiency**: Azure offers more competitive pricing for small to medium workloads
- **Better Integration**: Native integration with Azure Cognitive Services
- **Simplified Management**: Reduced complexity compared to AWS ECS/Fargate
- **Enhanced AI Capabilities**: Superior Computer Vision and AI services

### Migration Timeline

**Estimated Duration**: 2-4 hours for complete migration

**Phases**:
1. **Planning & Preparation** (30 minutes)
2. **Azure Resource Setup** (45 minutes)
3. **Code Migration** (60 minutes)
4. **Data Migration** (30 minutes)
5. **Testing & Validation** (45 minutes)

## Service Mapping Table

| AWS Service | Azure Equivalent | Migration Complexity | Notes |
|-------------|------------------|---------------------|-------|
| **Compute & Hosting** |
| ECS Fargate | Azure Container Instances | Medium | Direct container migration |
| EC2 | Azure Virtual Machines | Low | Similar VM concepts |
| Application Load Balancer | Azure Load Balancer | Low | Configuration differences |
| **AI & Machine Learning** |
| Amazon Rekognition | Azure Computer Vision | Low | Better OCR capabilities |
| Amazon Textract | Azure Form Recognizer | Medium | Enhanced document processing |
| Amazon Comprehend | Azure Text Analytics | Medium | Similar NLP features |
| **Storage & Database** |
| S3 | Azure Blob Storage | Low | Similar object storage |
| RDS | Azure Database | Low | Managed database services |
| DynamoDB | Azure Cosmos DB | Medium | NoSQL database migration |
| **Networking & Security** |
| VPC | Azure Virtual Network | Low | Similar networking concepts |
| Security Groups | Network Security Groups | Low | Equivalent firewall rules |
| IAM | Azure Active Directory | Medium | Different permission model |
| **Monitoring & Logging** |
| CloudWatch | Azure Monitor | Low | Similar monitoring capabilities |
| CloudTrail | Azure Activity Log | Low | Audit and compliance logging |
| **DevOps & Deployment** |
| CodePipeline | Azure DevOps | Medium | CI/CD pipeline migration |
| CloudFormation | Azure Resource Manager | Medium | Infrastructure as Code |

## Pre-Migration Planning

### 1. Inventory Current AWS Resources

```bash
# List all AWS resources used by DeckChatbot
aws ecs list-clusters
aws ecs list-services --cluster deckchatbot-cluster
aws s3 ls
aws rds describe-db-instances
aws logs describe-log-groups
```

### 2. Document Current Architecture

Create a diagram of your current AWS architecture:

```
AWS Current Architecture:
Internet → ALB → ECS Fargate → RDS
         ↓
    CloudWatch Logs
         ↓
    S3 (File Storage)
         ↓
    Rekognition (AI)
```

### 3. Estimate Costs

| Service | AWS Monthly Cost | Azure Monthly Cost | Savings |
|---------|------------------|-------------------|---------|
| Compute (ECS Fargate) | $120-180 | $31-50 (VM) | 60-75% |
| Storage (S3) | $10-20 | $8-15 (Blob) | 20-25% |
| AI Services | $15-30 | $10-20 | 30-35% |
| Networking | $5-10 | $3-8 | 40% |
| **Total** | **$150-240** | **$52-93** | **65%** |

### 4. Backup Current System

```bash
# Create complete backup of current system
aws s3 sync s3://your-bucket ./aws-backup/
mysqldump -h your-rds-endpoint -u username -p database_name > aws-database-backup.sql
docker save $(docker images -q) > aws-docker-images.tar
```

## Step-by-Step Migration Process

### Phase 1: Azure Environment Setup

#### Step 1: Create Azure Account and Subscription

1. **Sign up for Azure**: https://azure.microsoft.com/free/
2. **Create Resource Group**:
   ```bash
   az group create --name deckchatbot-rg --location eastus
   ```

#### Step 2: Set Up Azure Services

**Create Azure Computer Vision**:
```bash
az cognitiveservices account create \
  --name deckchatbot-vision \
  --resource-group deckchatbot-rg \
  --kind ComputerVision \
  --sku F0 \
  --location eastus
```

**Create Azure Storage Account**:
```bash
az storage account create \
  --name deckchatbotstorage \
  --resource-group deckchatbot-rg \
  --location eastus \
  --sku Standard_LRS
```

**Create Azure Virtual Machine**:
```bash
az vm create \
  --resource-group deckchatbot-rg \
  --name deckchatbot-vm \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard
```

#### Step 3: Configure Networking

```bash
# Open required ports
az vm open-port --port 80 --resource-group deckchatbot-rg --name deckchatbot-vm
az vm open-port --port 443 --resource-group deckchatbot-rg --name deckchatbot-vm
az vm open-port --port 22 --resource-group deckchatbot-rg --name deckchatbot-vm
```

### Phase 2: Code Migration

#### Step 1: Update Environment Configuration

Create new `.env.azure` file:

```bash
# Azure Configuration
AZURE_COMPUTER_VISION_KEY=your_azure_vision_key
AZURE_COMPUTER_VISION_ENDPOINT=https://eastus.api.cognitive.microsoft.com/
AZURE_STORAGE_CONNECTION_STRING=your_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=deckchatbot-uploads

# Database Configuration (if migrating to Azure Database)
AZURE_DATABASE_HOST=your-azure-db.database.windows.net
AZURE_DATABASE_NAME=deckchatbot
AZURE_DATABASE_USER=your_username
AZURE_DATABASE_PASSWORD=your_password

# Application Configuration
NODE_ENV=production
PORT=3001
AI_SERVICE_PORT=8000
```

#### Step 2: Update Service Configuration Files

**Update docker-compose.azure.yml**:
```yaml
version: '3.8'
services:
  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=https://your-domain.com/api
    
  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    environment:
      - AZURE_COMPUTER_VISION_KEY=${AZURE_COMPUTER_VISION_KEY}
      - AZURE_COMPUTER_VISION_ENDPOINT=${AZURE_COMPUTER_VISION_ENDPOINT}
      - AZURE_STORAGE_CONNECTION_STRING=${AZURE_STORAGE_CONNECTION_STRING}
    volumes:
      - ./uploads:/app/uploads
    
  ai-service:
    build: ./apps/ai-service
    ports:
      - "8000:8000"
    environment:
      - AZURE_COMPUTER_VISION_KEY=${AZURE_COMPUTER_VISION_KEY}
      - AZURE_COMPUTER_VISION_ENDPOINT=${AZURE_COMPUTER_VISION_ENDPOINT}
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/azure.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
```

### Phase 3: Data Migration

#### Step 1: Export Data from AWS

**Export S3 Files**:
```bash
# Download all files from S3
aws s3 sync s3://your-aws-bucket ./migration-data/files/

# Create file inventory
aws s3 ls s3://your-aws-bucket --recursive > aws-file-inventory.txt
```

**Export Database**:
```bash
# For RDS MySQL/PostgreSQL
mysqldump -h your-rds-endpoint -u username -p database_name > aws-database.sql

# For DynamoDB
aws dynamodb scan --table-name your-table --output json > aws-dynamodb-data.json
```

#### Step 2: Import Data to Azure

**Upload Files to Azure Blob Storage**:
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Upload files to Azure Blob Storage
az storage blob upload-batch \
  --destination deckchatbot-uploads \
  --source ./migration-data/files/ \
  --account-name deckchatbotstorage
```

**Import Database to Azure**:
```bash
# For Azure Database for MySQL/PostgreSQL
mysql -h your-azure-db.database.windows.net -u username -p database_name < aws-database.sql

# For Azure Cosmos DB (if migrating from DynamoDB)
# Use Azure Data Migration Service or custom scripts
```

## Code Transformation Examples

### 1. AWS Rekognition → Azure Computer Vision

**Before (AWS Rekognition)**:
```javascript
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function detectText(imageBuffer) {
  const params = {
    Image: {
      Bytes: imageBuffer
    }
  };
  
  const result = await rekognition.detectText(params).promise();
  return result.TextDetections.map(detection => ({
    text: detection.DetectedText,
    confidence: detection.Confidence,
    boundingBox: detection.Geometry.BoundingBox
  }));
}
```

**After (Azure Computer Vision)**:
```javascript
const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');

const client = new ComputerVisionClient(
  new ApiKeyCredentials({
    inHeader: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_COMPUTER_VISION_KEY
    }
  }),
  process.env.AZURE_COMPUTER_VISION_ENDPOINT
);

async function detectText(imageBuffer) {
  const result = await client.recognizeTextInStream(imageBuffer);
  
  return result.regions.flatMap(region =>
    region.lines.flatMap(line =>
      line.words.map(word => ({
        text: word.text,
        confidence: word.confidence || 0.95,
        boundingBox: word.boundingBox
      }))
    )
  );
}
```

### 2. AWS S3 → Azure Blob Storage

**Before (AWS S3)**:
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadFile(fileName, fileBuffer) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: 'image/jpeg'
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
}
```

**After (Azure Blob Storage)**:
```javascript
const { BlobServiceClient } = require('@azure/storage-blob');

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

async function uploadFile(fileName, fileBuffer) {
  const containerClient = blobServiceClient.getContainerClient(
    process.env.AZURE_STORAGE_CONTAINER_NAME
  );
  
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  
  await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
    blobHTTPHeaders: { blobContentType: 'image/jpeg' }
  });
  
  return blockBlobClient.url;
}
```

### 3. Environment Configuration Migration

**Before (AWS)**:
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=deckchatbot-uploads
REKOGNITION_REGION=us-east-1

# Database
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_DATABASE=deckchatbot
RDS_USERNAME=admin
RDS_PASSWORD=your_password
```

**After (Azure)**:
```bash
# Azure Configuration
AZURE_COMPUTER_VISION_KEY=your_vision_key
AZURE_COMPUTER_VISION_ENDPOINT=https://eastus.api.cognitive.microsoft.com/
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=deckchatbot-uploads

# Database
AZURE_DATABASE_HOST=your-azure-db.database.windows.net
AZURE_DATABASE_NAME=deckchatbot
AZURE_DATABASE_USER=your_username
AZURE_DATABASE_PASSWORD=your_password
```

## Configuration Changes

### 1. Update Package Dependencies

**Remove AWS Dependencies**:
```bash
npm uninstall aws-sdk
```

**Add Azure Dependencies**:
```bash
npm install @azure/cognitiveservices-computervision @azure/ms-rest-js @azure/storage-blob
```

**Update package.json**:
```json
{
  "dependencies": {
    "@azure/cognitiveservices-computervision": "^8.2.0",
    "@azure/ms-rest-js": "^2.6.0",
    "@azure/storage-blob": "^12.17.0"
  }
}
```

### 2. Update Service Configuration

**Create Azure-specific configuration file** (`config/azure.js`):
```javascript
module.exports = {
  computerVision: {
    key: process.env.AZURE_COMPUTER_VISION_KEY,
    endpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT,
    apiVersion: 'v3.2'
  },
  storage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME
  },
  database: {
    host: process.env.AZURE_DATABASE_HOST,
    database: process.env.AZURE_DATABASE_NAME,
    username: process.env.AZURE_DATABASE_USER,
    password: process.env.AZURE_DATABASE_PASSWORD,
    port: 3306,
    ssl: true
  }
};
```

### 3. Update Nginx Configuration

**Create Azure-specific Nginx config** (`nginx/azure.conf`):
```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:3001;
    }
    
    server {
        listen 80;
        server_name your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl;
        server_name your-domain.com;
        
        ssl_certificate /etc/ssl/certs/fullchain.pem;
        ssl_certificate_key /etc/ssl/certs/privkey.pem;
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            client_max_body_size 10M;
        }
    }
}
```

## Testing and Validation

### 1. Pre-Migration Testing

**Test AWS Services**:
```bash
# Test current AWS deployment
curl https://your-aws-domain.com/api/health
curl -X POST -F "file=@test-image.jpg" https://your-aws-domain.com/api/upload
```

### 2. Azure Service Testing

**Test Azure Computer Vision**:
```bash
# Test Azure Computer Vision API
curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
     -H "Content-Type: application/octet-stream" \
     --data-binary @test-image.jpg \
     "YOUR_ENDPOINT/vision/v3.2/ocr"
```

**Test Azure Storage**:
```bash
# Test Azure Blob Storage upload
az storage blob upload \
  --file test-image.jpg \
  --name test-image.jpg \
  --container-name deckchatbot-uploads \
  --account-name deckchatbotstorage
```

### 3. End-to-End Testing

**Functional Tests**:
```bash
# Test complete workflow
./scripts/test-migration.sh

# Test specific features
npm test -- --grep "Azure integration"
python -m pytest tests/test_azure_services.py
```

## Post-Migration Optimization

### 1. Performance Optimization

**Enable Azure CDN**:
```bash
az cdn profile create \
  --name deckchatbot-cdn \
  --resource-group deckchatbot-rg \
  --sku Standard_Microsoft

az cdn endpoint create \
  --name deckchatbot-endpoint \
  --profile-name deckchatbot-cdn \
  --resource-group deckchatbot-rg \
  --origin your-domain.com
```

**Configure Auto-scaling**:
```bash
az monitor autoscale create \
  --resource-group deckchatbot-rg \
  --resource deckchatbot-vm \
  --resource-type Microsoft.Compute/virtualMachines \
  --name deckchatbot-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

### 2. Security Hardening

**Configure Azure Key Vault**:
```bash
az keyvault create \
  --name deckchatbot-vault \
  --resource-group deckchatbot-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name deckchatbot-vault \
  --name computer-vision-key \
  --value "your_computer_vision_key"
```

**Update application to use Key Vault**:
```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://deckchatbot-vault.vault.azure.net/', credential);

async function getSecret(secretName) {
  const secret = await client.getSecret(secretName);
  return secret.value;
}
```

### 3. Monitoring Setup

**Configure Azure Monitor**:
```bash
az monitor log-analytics workspace create \
  --resource-group deckchatbot-rg \
  --workspace-name deckchatbot-logs \
  --location eastus
```

**Set up Application Insights**:
```bash
az extension add --name application-insights
az monitor app-insights component create \
  --app deckchatbot-insights \
  --location eastus \
  --resource-group deckchatbot-rg
```

## Troubleshooting Migration Issues

### Common Migration Problems

#### 1. Authentication Issues

**Problem**: Azure Computer Vision authentication fails
```
Error: Invalid subscription key
```

**Solution**:
```bash
# Verify key and endpoint
az cognitiveservices account keys list \
  --name deckchatbot-vision \
  --resource-group deckchatbot-rg

# Test manually
curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
     "YOUR_ENDPOINT/vision/v3.2/analyze?visualFeatures=Description"
```

#### 2. Storage Migration Issues

**Problem**: Files not accessible after migration
```
Error: Blob not found
```

**Solution**:
```bash
# Verify container exists
az storage container list --account-name deckchatbotstorage

# Check file permissions
az storage blob list \
  --container-name deckchatbot-uploads \
  --account-name deckchatbotstorage
```

#### 3. Database Connection Issues

**Problem**: Cannot connect to Azure Database
```
Error: Connection timeout
```

**Solution**:
```bash
# Check firewall rules
az mysql server firewall-rule create \
  --resource-group deckchatbot-rg \
  --server your-azure-db \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP

# Test connection
mysql -h your-azure-db.database.windows.net -u username -p
```

### Performance Issues

#### 1. Slow API Responses

**Problem**: Azure Computer Vision slower than AWS Rekognition

**Solution**:
```javascript
// Implement caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function analyzeImageWithCache(imageBuffer) {
  const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
  
  let result = cache.get(imageHash);
  if (!result) {
    result = await azureComputerVision.analyzeImage(imageBuffer);
    cache.set(imageHash, result);
  }
  
  return result;
}
```

#### 2. High Latency

**Problem**: Increased response times after migration

**Solution**:
```bash
# Use Azure regions closer to users
# Update endpoint to nearest region
AZURE_COMPUTER_VISION_ENDPOINT=https://westus2.api.cognitive.microsoft.com/

# Enable Azure CDN for static content
az cdn endpoint create \
  --name deckchatbot-cdn \
  --profile-name deckchatbot-profile \
  --resource-group deckchatbot-rg \
  --origin your-domain.com
```

## Validation Checklist

### Pre-Migration Checklist

- [ ] **AWS Resources Documented**
  - [ ] ECS services and tasks listed
  - [ ] S3 buckets and contents inventoried
  - [ ] RDS databases backed up
  - [ ] IAM roles and permissions documented
  - [ ] CloudWatch logs exported

- [ ] **Azure Resources Prepared**
  - [ ] Azure subscription active
  - [ ] Resource group created
  - [ ] Computer Vision service provisioned
  - [ ] Storage account created
  - [ ] Virtual machine or container service ready

- [ ] **Code Preparation**
  - [ ] AWS SDK dependencies identified
  - [ ] Azure SDK dependencies installed
  - [ ] Environment variables mapped
  - [ ] Configuration files updated

### Migration Execution Checklist

- [ ] **Service Migration**
  - [ ] Azure Computer Vision configured and tested
  - [ ] Azure Blob Storage setup and accessible
  - [ ] Database migrated and verified
  - [ ] Application deployed to Azure

- [ ] **Data Migration**
  - [ ] All files transferred from S3 to Blob Storage
  - [ ] Database data migrated successfully
  - [ ] File permissions and access verified
  - [ ] Data integrity checks passed

- [ ] **Configuration Updates**
  - [ ] Environment variables updated
  - [ ] DNS records pointed to Azure
  - [ ] SSL certificates configured
  - [ ] Load balancer/reverse proxy configured

### Post-Migration Validation

- [ ] **Functional Testing**
  - [ ] File upload functionality works
  - [ ] Image analysis produces correct results
  - [ ] API endpoints respond correctly
  - [ ] Database operations function properly
  - [ ] User authentication works (if applicable)

- [ ] **Performance Testing**
  - [ ] Response times within acceptable limits
  - [ ] Concurrent user load handled properly
  - [ ] Memory and CPU usage optimized
  - [ ] Error rates below threshold

- [ ] **Security Validation**
  - [ ] HTTPS enabled and working
  - [ ] API keys and secrets secured
  - [ ] Network security groups configured
  - [ ] Access logs enabled

- [ ] **Monitoring Setup**
  - [ ] Azure Monitor configured
  - [ ] Application Insights enabled
  - [ ] Alert rules created
  - [ ] Log aggregation working

### Final Verification

- [ ] **End-to-End Testing**
  - [ ] Complete user workflow tested
  - [ ] All features working as expected
  - [ ] Performance meets requirements
  - [ ] No data loss confirmed

- [ ] **Documentation Updated**
  - [ ] Deployment documentation updated
  - [ ] API documentation reflects Azure endpoints
  - [ ] Troubleshooting guide updated
  - [ ] Team trained on new Azure environment

- [ ] **AWS Cleanup**
  - [ ] AWS resources scheduled for deletion
  - [ ] Final backups created
  - [ ] DNS cutover completed
  - [ ] AWS costs monitoring disabled

### Success Criteria

✅ **Migration Successful When**:
- All functionality works identically to AWS version
- Performance is equal or better than AWS
- No data loss occurred during migration
- Cost savings achieved as projected
- Team comfortable with Azure environment
- Monitoring and alerting operational

### Rollback Plan

**If Migration Fails**:
1. **Immediate Rollback**:
   ```bash
   # Revert DNS to AWS
   # Restart AWS services if stopped
   # Verify AWS functionality
   ```

2. **Data Recovery**:
   ```bash
   # Restore from AWS backups
   # Verify data integrity
   # Resume AWS operations
   ```

3. **Post-Rollback Analysis**:
   - Document issues encountered
   - Plan remediation steps
   - Schedule retry with fixes

---

**Migration Support**: For additional assistance, refer to the main [README.md](README.md) troubleshooting section or contact the development team.

**Estimated Total Migration Time**: 2-4 hours
**Estimated Cost Savings**: 60-75% reduction in monthly cloud costs
**Risk Level**: Low (with proper backup and rollback procedures)
