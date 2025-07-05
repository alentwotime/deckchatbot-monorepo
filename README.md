# DeckChatbot: AI-Powered Deck Design Assistant

Welcome to DeckChatbot, a smart, single-page application designed to streamline the deck design and quoting process for sales professionals. By leveraging AI and Azure cloud services, this tool assists in converting customer sketches into interactive 2D blueprints and 3D models, calculating materials, and providing real-time guidance.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technical Stack](#technical-stack)
4. [Installation Instructions](#installation-instructions)
5. [Azure Service Setup](#azure-service-setup)
6. [Visual Features Documentation](#visual-features-documentation)
7. [Upload Functionality Guide](#upload-functionality-guide)
8. [API Documentation](#api-documentation)
9. [Deployment Guides](#deployment-guides)
10. [Troubleshooting](#troubleshooting)

## Project Overview

### User Journey: The 5 Stages of Deck Design

The website guides the user through a seamless, five-stage process on a single scrolling page. A persistent chatbot, acting as an assistant to the salesperson, is available at every stage to provide contextual tips and support.

#### Stage 1: Introduction & Chatbot
The user is greeted with a full-screen interactive chatbot that introduces the deck design process. As the user scrolls, the chatbox elegantly shrinks to the corner, remaining accessible throughout the journey.

#### Stage 2: Upload Your Deck Plans
Users can upload customer-provided files:
*   **Drawings/Blueprints**: Sketches or professional blueprints with measurements (PDF, PNG, JPEG).
*   **Photos of the Area**: Pictures of the installation site for accurate 3D modeling (JPEG, PNG).

The system features drag-and-drop functionality and performs real-time validation on file types and sizes.

#### Stage 3: Analysis & Calculation
The AI backend analyzes the uploaded sketches to automatically extract and display key metrics:
*   Gross Living Area (sq ft)
*   Net Square Footage (sq ft)
*   Linear Railing Footage (ft)
*   Stair Cutouts

An overlay on the sketch visualizes the calculated dimensions, with options for manual adjustments to ensure accuracy.

#### Stage 4: Your Digital Blueprint
A clean, digital 2D blueprint is generated from the analyzed sketch. This interactive canvas allows for edits, such as adding or modifying deck elements like railings and stairs. The blueprint can be downloaded in PDF, JPEG, or SVG formats.

#### Stage 5: 3D Deck Preview
A real-time 3D model of the deck is rendered using Three.js/Babylon.js. Key features include:
*   **Interactive Viewer**: Rotate, zoom, and pan the model.
*   **Photo Superimposition**: Overlay the 3D model onto the customer's site photos.
*   **Material Selection**: Change decking and railing materials and colors.
*   **Download Options**: Export the model as an OBJ/GLB file or take a PNG screenshot.
*   **Enhanced Difix Integration**: Advanced NVIDIA Difix model integration with multiple quality levels and enhancement types for professional 3D rendering.
*   **Voice Commands**: Use voice commands to navigate and modify the 3D preview hands-free.

## Core Features

### Enhanced AI Capabilities
*   **Multi-Model AI System**: Intelligent model selection using Neural-Chat, Llama 3.1 8B, Qwen 2.5-VL, and Phi-3 Mini for optimal performance across different tasks.
*   **Context-Aware Conversations**: Advanced chatbot with vector database integration for contextual responses and knowledge retention.
*   **Enhanced Multimodal Analysis**: Superior blueprint interpretation and visual understanding using Qwen 2.5-VL.
*   **Voice Interaction**: Whisper ASR integration for hands-free operation and voice commands throughout the design process.

### Advanced Processing
*   **Automated Measurement Extraction**: AI-driven analysis of uploaded drawings to detect dimensions and features with enhanced accuracy.
*   **Sketch-to-Blueprint Conversion**: Generates clean, editable 2D blueprints from user sketches with improved precision.
*   **Real-time 3D Modeling**: Instantly visualizes the deck design in an interactive 3D environment with NVIDIA Difix enhancement.
*   **Knowledge Base Search**: Semantic search capabilities for deck design information and similar project matching.

### Technical Excellence
*   **Secure File Handling**: Ensures all customer uploads are handled securely, with encryption in transit and at rest.
*   **Modular & Scalable**: Built with a modern microservices architecture for reliability and performance.
*   **Vector Database Integration**: ChromaDB for efficient knowledge storage and contextual retrieval.
*   **Fallback Mechanisms**: Robust error handling with intelligent model fallbacks for consistent performance.

## Technical Stack

*   **Frontend**: React.js/Vue.js, HTML5, CSS3, JavaScript (ES6+), Three.js/Babylon.js
*   **Backend**: Node.js (Express) / Python (FastAPI, Django)
*   **AI & Machine Learning**: 
    *   **Language Models**: Neural-Chat, Llama 3.1 8B, Qwen 2.5-VL, Phi-3 Mini via Ollama
    *   **Computer Vision**: Enhanced OCR and multimodal image analysis
    *   **Speech Recognition**: OpenAI Whisper for voice interaction
    *   **3D Enhancement**: NVIDIA Difix for rendering improvement
*   **Vector Database**: ChromaDB for semantic search and knowledge management
*   **Database**: SQLite for storing conversation history and measurements
*   **Development Tools**: Streamlit, LangChain for AI application development
*   **Cloud Services**: Azure Computer Vision, Azure Cognitive Services
*   **Infrastructure**: Docker, Nginx, SSL/TLS encryption

## Installation Instructions

### Prerequisites

Before installing DeckChatbot, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Docker** and **Docker Compose**
- **Git** for version control

### Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/deckchatbot-monorepo.git
   cd deckchatbot-monorepo
   ```

2. **Environment Configuration**:
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env file with your configuration
   # See Azure Service Setup section for required values
   ```

3. **Install Dependencies**:
   ```bash
   # Install all Node.js dependencies (Windows PowerShell)
   # Option 1: Run the provided PowerShell script
   powershell -ExecutionPolicy Bypass -File .\install-all.ps1

   # Option 2: Run commands individually
   npm install
   cd apps\backend && npm install
   cd ..\..\apps\frontend && npm install
   cd ..\..

   # Option 3: For bash/cmd terminals
   npm run install:all

   # Install Python dependencies
   pip install -r apps/ai-service/requirements.txt
   ```

4. **Start Development Environment**:
   ```bash
   # Using Docker Compose (Recommended)
   docker-compose -f docker/docker-compose.yml up --build

   # Or start services individually
   npm run dev:frontend
   npm run dev:backend
   python -m uvicorn apps.ai-service.main:app --reload
   ```

5. **Verify Installation**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - AI Service: http://localhost:8000

## Azure Service Setup

DeckChatbot leverages several Azure services for enhanced AI capabilities. Follow these steps to configure Azure integration:

### Required Azure Services

1. **Azure Computer Vision**
2. **Azure Cognitive Services**
3. **Azure Storage Account** (optional, for file storage)

### Step-by-Step Azure Configuration

#### 1. Create Azure Computer Vision Resource

1. **Login to Azure Portal**: https://portal.azure.com
2. **Create Resource**:
   - Search for "Computer Vision"
   - Click "Create"
   - Select your subscription and resource group
   - Choose a region (East US recommended)
   - Select pricing tier (F0 for free tier, S1 for production)

3. **Get API Keys**:
   - Navigate to your Computer Vision resource
   - Go to "Keys and Endpoint"
   - Copy Key 1 and Endpoint URL

#### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Azure Computer Vision
AZURE_COMPUTER_VISION_KEY=your_computer_vision_key_here
AZURE_COMPUTER_VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/

# Azure Configuration
AZURE_REGION=eastus
AZURE_SUBSCRIPTION_ID=your_subscription_id

# Optional: Azure Storage (for file uploads)
AZURE_STORAGE_CONNECTION_STRING=your_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=deckchatbot-uploads
```

#### 3. Test Azure Integration

Run the Azure configuration test:

```bash
node test-azure-config.js
```

Expected output:
```
✅ Azure Computer Vision: Connected
✅ Configuration: Valid
✅ All Azure services ready!
```

### Azure Service Features

- **Text Extraction (OCR)**: Extract text from uploaded blueprints and drawings
- **Object Detection**: Identify deck components, measurements, and annotations
- **Image Analysis**: Analyze uploaded photos for 3D modeling context
- **Card Recognition**: Detect and recognize deck design elements
- **Visual Quality Assessment**: Evaluate image quality for processing

For detailed Azure setup troubleshooting, see [AZURE_SECRETS_SETUP.md](AZURE_SECRETS_SETUP.md).

## Visual Features Documentation

DeckChatbot provides comprehensive visual analysis capabilities powered by Azure Computer Vision and custom AI models.

### Core Visual Features

#### 1. Blueprint Analysis
- **Automatic Dimension Detection**: Extract measurements from hand-drawn sketches
- **Component Recognition**: Identify deck elements (railings, stairs, posts)
- **Layout Analysis**: Understand spatial relationships and proportions
- **Annotation Processing**: Read and interpret text annotations

#### 2. Photo Analysis
- **Site Assessment**: Analyze installation area photos
- **3D Context Generation**: Extract depth and spatial information
- **Material Recognition**: Identify existing materials and surfaces
- **Lighting Analysis**: Assess lighting conditions for 3D rendering

#### 3. Drawing Enhancement
- **Sketch Cleanup**: Remove noise and enhance line clarity
- **Dimension Validation**: Cross-reference measurements for accuracy
- **Missing Element Detection**: Identify incomplete specifications
- **Quality Assessment**: Evaluate drawing completeness

### Visual Processing Pipeline

```
Upload → Validation → Preprocessing → Analysis → Enhancement → Results
```

#### 1. Upload Validation
- **File Format Check**: Supports JPEG, PNG, PDF
- **Size Validation**: Max 10MB for blueprints, 5MB for photos
- **Quality Assessment**: Minimum resolution requirements
- **Content Verification**: Ensures relevant deck-related content

#### 2. Preprocessing
- **Image Optimization**: Resize and compress for optimal processing
- **Noise Reduction**: Remove artifacts and improve clarity
- **Contrast Enhancement**: Improve text and line visibility
- **Orientation Correction**: Auto-rotate images if needed

#### 3. AI Analysis
- **OCR Processing**: Extract all text using Azure Computer Vision
- **Object Detection**: Identify deck components and measurements
- **Line Detection**: Find structural elements and boundaries
- **Spatial Analysis**: Understand layout and proportions

#### 4. Results Generation
- **Structured Data**: Convert visual elements to structured format
- **Confidence Scores**: Provide accuracy ratings for each detection
- **Suggestions**: Recommend improvements or clarifications
- **Interactive Overlays**: Visual feedback on original images

### Supported Visual Elements

| Element Type | Detection Accuracy | Processing Time |
|--------------|-------------------|-----------------|
| Text/Dimensions | 95%+ | 2-3 seconds |
| Deck Outlines | 90%+ | 3-5 seconds |
| Railings | 85%+ | 2-4 seconds |
| Stairs | 80%+ | 3-6 seconds |
| Posts/Supports | 75%+ | 2-4 seconds |
| Annotations | 90%+ | 1-2 seconds |

### Advanced Visual Features

#### 3D Model Generation
- **Depth Estimation**: Calculate 3D dimensions from 2D drawings
- **Texture Mapping**: Apply materials based on photo analysis
- **Lighting Simulation**: Realistic lighting based on site photos
- **Interactive Viewing**: 360° rotation, zoom, and pan

#### Quality Enhancement
- **NVIDIA Difix Integration**: Professional-grade 3D rendering
- **Multiple Quality Levels**: Fast preview to high-quality export
- **Enhancement Types**: Lighting, materials, shadows, reflections

## Upload Functionality Guide

The upload system supports multiple file types and provides real-time validation and processing feedback.

### Supported File Types and Limits

#### Blueprints and Drawings
- **Formats**: JPEG (.jpg, .jpeg), PNG (.png), PDF (.pdf)
- **Size Limit**: 10MB maximum per file
- **Resolution**: Minimum 800x600 pixels recommended
- **Content**: Hand-drawn sketches, CAD drawings, architectural plans

#### Reference Photos
- **Formats**: JPEG (.jpg, .jpeg), PNG (.png)
- **Size Limit**: 5MB maximum per file
- **Resolution**: Minimum 1024x768 pixels recommended
- **Content**: Site photos, existing deck conditions, inspiration images

### Upload Process

#### Method 1: Drag and Drop
1. **Locate Upload Area**: Find the dashed border upload zones
2. **Drag Files**: Drag your files directly into the appropriate zone
3. **Visual Feedback**: See real-time upload progress and validation
4. **Confirmation**: Receive "Selected: [filename]" confirmation

#### Method 2: Click to Browse
1. **Click Upload Area**: Click anywhere in the upload zone
2. **File Browser**: System file browser opens automatically
3. **Select Files**: Choose single or multiple files (photos only)
4. **Auto-Upload**: Files upload immediately after selection

### Upload Validation

#### Real-Time Checks
- **File Type Validation**: Instant feedback on supported formats
- **Size Validation**: Immediate notification if files exceed limits
- **Content Scanning**: Basic content validation for relevance
- **Duplicate Detection**: Prevents uploading identical files

#### Error Handling
- **Clear Error Messages**: Specific feedback for each validation failure
- **Retry Options**: Easy re-upload for corrected files
- **Progress Indicators**: Visual feedback during upload process
- **Timeout Handling**: Graceful handling of network issues

### Upload Security

#### File Safety
- **Virus Scanning**: All uploads scanned for malware
- **Content Filtering**: Inappropriate content detection
- **Secure Storage**: Encrypted storage with automatic cleanup
- **Access Control**: User-specific file isolation

#### Privacy Protection
- **Data Encryption**: Files encrypted in transit and at rest
- **Automatic Deletion**: Temporary files cleaned up after processing
- **No Permanent Storage**: Files not retained after session ends
- **GDPR Compliance**: Full compliance with data protection regulations

### Upload Troubleshooting

#### Common Issues and Solutions

**File Too Large**
- Compress images using online tools
- Reduce image resolution while maintaining readability
- Split large PDFs into smaller sections

**Unsupported Format**
- Convert files to supported formats (JPEG, PNG, PDF)
- Use online conversion tools if needed
- Ensure file extensions are correct

**Upload Fails**
- Check internet connection stability
- Try uploading one file at a time
- Clear browser cache and cookies
- Disable browser extensions temporarily

**Poor Processing Results**
- Ensure images are clear and well-lit
- Avoid blurry or low-resolution images
- Include measurement annotations when possible
- Provide multiple angles for complex designs

For detailed troubleshooting, see the [Troubleshooting](#troubleshooting) section below.

## API Documentation

DeckChatbot provides comprehensive REST APIs for all functionality. The system consists of multiple microservices with well-defined endpoints.

### API Services Overview

- **Backend Service** (Node.js/Express) - Port 3001
- **AI Service** (Python/FastAPI) - Port 8000
- **Backend Python API** (FastAPI) - Port 8001

### Authentication

Currently designed for internal service communication without explicit authentication. For production deployment, implement API keys or JWT tokens.

### Core API Endpoints

#### Visual Analysis Endpoints

**Extract Text from Image**
```http
POST /api/vision/extract-text
Content-Type: multipart/form-data

{
  "image": <file>,
  "options": {
    "language": "en",
    "detectOrientation": true
  }
}
```

**Analyze Deck Photo**
```http
POST /api/vision/analyze-deck
Content-Type: multipart/form-data

{
  "image": <file>,
  "analysisType": "full",
  "includeMetadata": true
}
```

**Recognize Cards/Components**
```http
POST /api/vision/recognize-cards
Content-Type: multipart/form-data

{
  "image": <file>,
  "recognitionMode": "detailed"
}
```

#### AI Enhancement Endpoints

**Enhanced Chat**
```http
POST /api/ai/enhanced-chat
Content-Type: application/json

{
  "message": "How do I calculate deck square footage?",
  "context": "blueprint_analysis",
  "user_id": "optional_user_id"
}
```

**3D Enhancement (NVIDIA Difix)**
```http
POST /api/ai/difix-enhance
Content-Type: application/json

{
  "model_data": "base64_encoded_3d_model",
  "enhancement_type": "lighting",
  "quality_level": "high"
}
```

**Voice Transcription**
```http
POST /api/ai/transcribe-voice
Content-Type: multipart/form-data

{
  "audio": <file>,
  "language": "en-US"
}
```

#### Blueprint Processing Endpoints

**Generate Blueprint**
```http
POST /api/blueprint/generate
Content-Type: application/json

{
  "analysis_data": {...},
  "settings": {
    "format": "svg",
    "scale": "1:100",
    "include_dimensions": true
  }
}
```

**3D Model Generation**
```http
POST /api/3d/generate-model
Content-Type: application/json

{
  "blueprint_data": {...},
  "materials": ["composite", "wood"],
  "export_format": "glb"
}
```

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": {...},
  "processing_time": "2.3s",
  "confidence": 0.95
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "error_code": "VALIDATION_ERROR",
  "details": {...}
}
```

### Rate Limiting

- **Standard Endpoints**: 100 requests/minute
- **AI Processing**: 10 requests/minute
- **File Upload**: 5 uploads/minute

For complete API documentation with examples, see [`docs/api-documentation.md`](docs/api-documentation.md).

## Running the Project Locally

1.  **Prerequisites**: Ensure you have Node.js, Python 3.11, and Docker installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    pip install -r config/requirements.txt
    ```
3.  **Run with Docker Compose**:
    ```bash
    docker-compose -f docker/docker-compose.yml up --build
    ```

## Deployment Guides

Choose your preferred deployment method based on your requirements and budget:

### Local Development
See the "Running the Project Locally" section above for local development setup.

### Azure VM Deployment (RECOMMENDED)

Azure VM deployment provides the best balance of performance, cost, and scalability for DeckChatbot.

#### Quick Start (Automated Deployment)

**Prerequisites:**
- Azure account with active subscription
- Basic familiarity with Azure Portal
- SSH client (built-in on macOS/Linux, PuTTY on Windows)

**Step 1: Create Azure VM**

**Option 1: Automated Setup (Recommended)**
1. **Run the Azure VM setup script**:
   ```powershell
   .\scripts\create-azure-vm.ps1
   ```
   This script will:
   - Check prerequisites (Azure CLI, login status)
   - Create a resource group if needed
   - Create an Azure VM with recommended settings
   - Open required ports
   - Display connection information

   For detailed instructions, see:
   - [Azure VM Setup Guide](docs/azure-vm-setup.md)
   - [PowerShell Deployment Guide](docs/powershell-deployment-guide.md) (for Windows users)

   To view the current deployment status, see [Deployment Status](docs/deployment-status.md)

**Option 2: Manual Setup via Azure Portal**
1. **Login to Azure Portal**: https://portal.azure.com
2. **Create Virtual Machine**:
   - Click "Create a resource" → "Virtual Machine"
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or use existing
   - **VM Name**: `deckchatbot-vm`
   - **Region**: East US (recommended for best performance)
   - **Image**: Ubuntu Server 22.04 LTS
   - **Size**: Standard B2s (2 vCPUs, 4GB RAM) - $31/month
   - **Authentication**: SSH public key (recommended) or password

3. **Configure Networking**:
   - **Public IP**: Create new
   - **Inbound Ports**: Allow SSH (22), HTTP (80), HTTPS (443)
   - **NIC Network Security Group**: Basic

4. **Review and Create**: Click "Create" and wait for deployment

**Step 2: Connect to VM**
```bash
# Replace with your VM's public IP
ssh azureuser@YOUR_VM_PUBLIC_IP
```

**Step 3: Automated Installation**
```bash
# Download and run the automated deployment script
Invoke-WebRequest -Uri https://raw.githubusercontent.com/AlenTwoTime/deckchatbot-monorepo/main/scripts/deploy-azure.sh -OutFile deploy-azure.sh
bash deploy-azure.sh
```

**What the script does:**
- ✅ Installs Docker and Docker Compose
- ✅ Clones the repository
- ✅ Sets up SSL certificates with Let's Encrypt
- ✅ Configures Nginx reverse proxy
- ✅ Starts all services
- ✅ Sets up automatic backups
- ✅ Configures firewall and security

**Step 4: Configure Domain (Optional)**
```bash
# If you have a domain, point it to your VM's public IP
# Then run:
sudo ./scripts/setup-domain.sh your-domain.com
```

**Expected Result:**
- 🌐 Application accessible at `https://your-vm-ip` or `https://your-domain.com`
- 🔒 SSL certificate automatically configured
- 📊 Monitoring dashboard available
- 💾 Automatic daily backups

#### Manual Setup Alternative

For advanced users who prefer manual configuration:

**Step 1: Prepare Environment**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Step 2: Clone and Configure**
```bash
# Clone repository
git clone https://github.com/your-username/deckchatbot-monorepo.git
cd deckchatbot-monorepo

# Configure environment
cp .env.example .env
nano .env  # Edit with your Azure credentials
```

**Step 3: Deploy Services**
```bash
# Build and start services
docker-compose -f docker/docker-compose.prod.yml up -d

# Set up SSL (if domain configured)
sudo ./scripts/setup-ssl.sh
```

#### Azure VM Architecture

```
Internet → Azure Load Balancer → VM → Nginx → Docker Services
                                      ├── Frontend (React)
                                      ├── Backend (Node.js)
                                      ├── AI Service (Python)
                                      └── Database (SQLite)
```

**Security Features:**
- Network Security Groups (NSG) for firewall rules
- SSH key authentication
- SSL/TLS encryption
- Automatic security updates
- Fail2ban for intrusion prevention

**Monitoring & Maintenance:**
- Azure Monitor integration
- Automatic log rotation
- Health check endpoints
- Backup automation
- Update notifications

### AWS Cloud Deployment

Deploy DeckChatbot to AWS using ECS Fargate for enterprise-grade scalability:

#### Prerequisites
- AWS CLI installed and configured
- Docker installed
- SSL certificate in AWS Certificate Manager
- Domain name (recommended)

#### Quick AWS Deployment
```bash
# Set required environment variables
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
export DOMAIN_NAME=your-domain.com

# Run deployment script
cd aws/scripts
chmod +x *.sh
./deploy.sh
```

#### AWS Architecture
- **ECS Fargate**: Containerized services with auto-scaling
- **Application Load Balancer**: SSL termination and traffic routing
- **VPC**: Secure network with public/private subnets
- **ECR**: Container image registry
- **CloudWatch**: Logging and monitoring
- **Parameter Store**: Secure configuration management

**Cost Estimation**: ~$120-230/month (varies by usage)

For AWS deployment details, see the AWS README:
- **Technical Details**: [`aws/README.md`](aws/README.md)

Note: Detailed AWS deployment guides have been moved to the archived code folder.

### Alternative Deployment Options

#### Render.com (FREE)
Deploy for free using the pre-configured `render.yaml`:
1. Create a [Render account](https://render.com)
2. Connect your GitHub repository
3. Render automatically detects the configuration
4. All services deploy on the free tier

#### Self-Hosted VPS
Use the existing Docker Compose setup on any VPS:
```bash
# On your VPS (Ubuntu/Debian)
git clone your-repo
cd deckchatbot-monorepo/docker
docker-compose up -d
```

#### Docker Swarm (Multi-Node)
For high-availability deployments:
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker/docker-compose.swarm.yml deckchatbot
```

### Deployment Comparison

| Method | Cost/Month | Setup Time | Scalability | Maintenance |
|--------|------------|------------|-------------|-------------|
| Azure VM | $31+ | 15 minutes | Medium | Low |
| AWS ECS | $120+ | 30 minutes | High | Very Low |
| Render.com | Free | 5 minutes | Low | None |
| Self-Hosted | $5-20 | 45 minutes | Medium | Medium |

**📋 Cost Comparison**: The table above provides a basic comparison of deployment options. Detailed cost comparison documentation has been moved to the archived code folder.

## AI Enhancements Setup

### Model Installation
To use the enhanced AI capabilities, install the recommended models:

```bash
# Install Ollama models
ollama pull neural-chat      # Enhanced conversation
ollama pull llama3.1:8b     # Fallback conversation model
ollama pull qwen2.5-vl      # Multimodal analysis
ollama pull phi3:mini       # Reasoning tasks
```

### Environment Configuration
Set up environment variables for enhanced features:

```bash
# Optional: Override default models
export CONVERSATION_MODEL=neural-chat
export MULTIMODAL_MODEL=qwen2.5-vl
export REASONING_MODEL=phi3:mini

# Optional: Hugging Face API key for Difix enhancement
export HUGGING_FACE_API_KEY=your_hf_api_key_here
```

### Testing Enhanced Features
Run the AI enhancements test suite:

```bash
cd apps/ai-service
python test_enhancements.py
```

### New API Endpoints
The enhanced AI service provides additional endpoints:

- `POST /enhanced-chat` - Context-aware conversations with intelligent model selection
- `POST /difix-enhance` - 3D rendering enhancement using NVIDIA Difix
- `POST /transcribe-voice` - Voice command transcription and processing
- `POST /search-knowledge` - Semantic search in the deck design knowledge base
- `POST /analyze-blueprint-enhanced` - Advanced blueprint analysis with context storage
- `GET /ai-capabilities` - Information about available AI features

For detailed documentation, see `docs/ai_enhancements.md`.

## Troubleshooting

This comprehensive troubleshooting guide covers common issues and their solutions across all aspects of DeckChatbot.

### Quick Diagnostic Commands

Run these commands to quickly diagnose system status:

```bash
# Check all services status
docker-compose ps

# View logs for specific service
docker-compose logs [service-name]

# Test Azure connectivity
node test-azure-config.js

# Verify API endpoints
curl http://localhost:3001/api/hello
curl http://localhost:8000/health
```

### Installation Issues

#### Docker Installation Problems

**Issue**: Docker installation fails or permission denied
```bash
# Solution: Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker installation
docker --version
docker-compose --version
```

**Issue**: Docker Compose not found
```bash
# Solution: Install Docker Compose manually
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Docker Daemon Configuration

**Issue**: Docker performance or resource issues
```
Symptoms: Slow builds, container crashes, disk space problems
```

**Solution**: Optimize Docker daemon configuration
1. Use our automated configuration scripts:

   **Windows**:
   ```powershell
   # Run as Administrator
   .\scripts\daemon-config.ps1
   Restart-Service docker
   ```

   **Linux**:
   ```bash
   # Run with sudo
   sudo ./scripts/daemon-config.sh
   sudo systemctl restart docker
   ```

2. Verify the configuration:
   ```bash
   docker info
   ```

These scripts create an optimized `daemon.json` file with:
- Efficient builder cache management
- Network settings matching our docker-compose configuration
- BuildKit enabled for faster builds
- Appropriate resource limits for AI workloads
- Log rotation to prevent disk space issues
- Security enhancements

For detailed documentation, see [Docker Daemon Configuration Guide](docs/docker-daemon-configuration.md).

#### Node.js and Python Issues

**Issue**: Node.js version incompatibility
```bash
# Solution: Install correct Node.js version
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify version
node --version  # Should be v18+
```

**Issue**: Python dependencies fail to install
```bash
# Solution: Update pip and install dependencies
python -m pip install --upgrade pip
pip install -r config/requirements.txt

# For Ubuntu/Debian systems
sudo apt-get install python3-dev python3-pip
```

### Azure Service Issues

#### Authentication Problems

**Issue**: Azure Computer Vision authentication fails
```
Error: Invalid subscription key or endpoint
```

**Solution**:
1. Verify your Azure Computer Vision key in `.env` file
2. Check endpoint URL format: `https://your-region.api.cognitive.microsoft.com/`
3. Ensure the service is active in Azure Portal
4. Test with diagnostic command:
```bash
curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
     "YOUR_ENDPOINT/vision/v3.2/analyze?visualFeatures=Description"
```

#### Service Quota Issues

**Issue**: Azure API rate limiting or quota exceeded
```
Error: Rate limit exceeded or quota exhausted
```

**Solution**:
1. Check your Azure subscription limits
2. Upgrade to a paid tier if using free tier
3. Implement request throttling in your application
4. Monitor usage in Azure Portal

#### Regional Availability

**Issue**: Service not available in selected region
```
Error: The specified region does not support this service
```

**Solution**:
1. Use East US, West US 2, or West Europe regions
2. Update `AZURE_REGION` in your `.env` file
3. Recreate the Azure resource in a supported region

### Upload and File Processing Issues

#### File Upload Failures

**Issue**: Files fail to upload or process
```
Error: File upload failed or processing timeout
```

**Solutions**:

**File Size Issues**:
```bash
# Check file sizes
ls -lh uploads/

# Compress large images
convert large-image.jpg -quality 85 -resize 2048x2048> compressed-image.jpg
```

**Format Issues**:
```bash
# Convert unsupported formats
convert drawing.bmp drawing.png
convert document.tiff document.pdf
```

**Network Issues**:
```bash
# Test upload endpoint
curl -X POST -F "file=@test-image.jpg" http://localhost:3001/api/upload
```

#### Poor OCR Results

**Issue**: Text extraction returns poor or no results

**Solutions**:

**Image Quality**:
- Ensure minimum 800x600 resolution
- Use good lighting and contrast
- Avoid blurry or skewed images
- Include clear text annotations

**Preprocessing**:
```bash
# Enhance image quality before upload
convert input.jpg -enhance -sharpen 0x1 -contrast enhanced.jpg
```

**Alternative OCR Settings**:
```javascript
// Try different OCR languages
const ocrOptions = {
  language: 'en',
  detectOrientation: true,
  textRecognitionMode: 'Printed'  // or 'Handwritten'
};
```

### API and Service Issues

#### Service Connection Problems

**Issue**: Cannot connect to backend services
```
Error: Connection refused or timeout
```

**Solutions**:

**Check Service Status**:
```bash
# Verify all services are running
docker-compose ps

# Restart specific service
docker-compose restart backend
docker-compose restart ai-service
```

**Port Conflicts**:
```bash
# Check for port conflicts
netstat -tulpn | grep :3001
netstat -tulpn | grep :8000

# Kill conflicting processes
sudo kill -9 $(lsof -t -i:3001)
```

**Firewall Issues**:
```bash
# Allow ports through firewall
sudo ufw allow 3001
sudo ufw allow 8000
sudo ufw allow 80
sudo ufw allow 443
```

#### API Response Issues

**Issue**: API returns 500 Internal Server Error

**Solutions**:

**Check Logs**:
```bash
# View detailed error logs
docker-compose logs backend
docker-compose logs ai-service

# Follow logs in real-time
docker-compose logs -f backend
```

**Environment Variables**:
```bash
# Verify all required environment variables
cat .env | grep -E "(AZURE|API|DATABASE)"

# Test configuration
node -e "console.log(process.env.AZURE_COMPUTER_VISION_KEY ? 'Azure key found' : 'Azure key missing')"
```

### Deployment Issues

#### Azure VM Deployment Problems

**Issue**: SSH connection fails
```
Error: Permission denied (publickey)
```

**Solutions**:
```bash
# Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Add public key to Azure VM
cat ~/.ssh/id_rsa.pub
# Copy this to Azure VM SSH keys section

# Test connection with verbose output
ssh -v azureuser@your-vm-ip
```

**Issue**: Automated deployment script fails

**Solutions**:
```bash
# Run script with debug output
bash -x deploy-azure.sh

# Check system requirements
curl -fsSL https://get.docker.com | sh
sudo systemctl status docker

# Verify internet connectivity
ping google.com
curl -I https://github.com
```

#### SSL Certificate Issues

**Issue**: SSL certificate generation fails
```
Error: Let's Encrypt certificate request failed
```

**Solutions**:
```bash
# Verify domain DNS settings
nslookup your-domain.com

# Check port 80 accessibility
sudo netstat -tulpn | grep :80

# Manual certificate generation
sudo certbot --nginx -d your-domain.com

# Test certificate renewal
sudo certbot renew --dry-run
```

### Performance Issues

#### Slow Processing Times

**Issue**: Image analysis takes too long

**Solutions**:

**Optimize Images**:
```bash
# Resize large images before processing
convert large-image.jpg -resize 1920x1080> optimized-image.jpg

# Compress without quality loss
jpegoptim --max=85 image.jpg
```

**Resource Allocation**:
```yaml
# Increase Docker memory limits in docker-compose.yml
services:
  ai-service:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

**Caching**:
```bash
# Enable Redis caching for API responses
docker-compose -f docker-compose.cache.yml up -d
```

#### Memory Issues

**Issue**: Out of memory errors during processing

**Solutions**:
```bash
# Monitor memory usage
docker stats

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Add to /etc/fstab for persistence
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Database Issues

#### SQLite Database Problems

**Issue**: Database corruption or access errors
```
Error: Database is locked or corrupted
```

**Solutions**:
```bash
# Check database integrity
sqlite3 database.db "PRAGMA integrity_check;"

# Backup and restore database
cp database.db database.db.backup
sqlite3 database.db ".backup database_restored.db"

# Reset database if corrupted
rm database.db
docker-compose restart backend
```

### Monitoring and Logging

#### Log Analysis

**View Application Logs**:
```bash
# Backend service logs
docker-compose logs backend | tail -100

# AI service logs with timestamps
docker-compose logs -t ai-service

# Filter error logs only
docker-compose logs backend 2>&1 | grep -i error
```

**System Monitoring**:
```bash
# Monitor resource usage
htop
docker stats

# Check disk space
df -h
du -sh /var/lib/docker/

# Monitor network connections
netstat -tulpn | grep LISTEN
```

### Getting Help

#### Support Resources

1. **Documentation**: Check [`docs/`](docs/) directory for detailed guides
2. **API Documentation**: [`docs/api-documentation.md`](docs/api-documentation.md)
3. **User Guide**: [`docs/user-guide.md`](docs/user-guide.md)
4. **Troubleshooting Quick Reference**: [`docs/troubleshooting-quick-reference.md`](docs/troubleshooting-quick-reference.md)

#### Reporting Issues

When reporting issues, please include:

1. **System Information**:
   ```bash
   # Gather system info
   uname -a
   docker --version
   docker-compose --version
   node --version
   python --version
   ```

2. **Error Logs**:
   ```bash
   # Collect relevant logs
   docker-compose logs > system-logs.txt
   ```

3. **Configuration**:
   ```bash
   # Environment variables (remove sensitive data)
   env | grep -E "(NODE|PYTHON|DOCKER)" > env-info.txt
   ```

4. **Steps to Reproduce**: Detailed steps that led to the issue

#### Emergency Recovery

**Complete System Reset**:
```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker system prune -a --volumes

# Restart from clean state
git pull origin main
docker-compose up --build
```

**Backup and Restore**:
```bash
# Create backup
tar -czf deckchatbot-backup-$(date +%Y%m%d).tar.gz \
    .env database.db uploads/ logs/

# Restore from backup
tar -xzf deckchatbot-backup-YYYYMMDD.tar.gz
```

For additional support, consult the migration guide [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) for AWS to Azure transition issues.
