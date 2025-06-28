# DeckChatbot: AI-Powered Deck Design Assistant

Welcome to DeckChatbot, a smart, single-page application designed to streamline the deck design and quoting process for sales professionals. By leveraging AI, this tool assists in converting customer sketches into interactive 2D blueprints and 3D models, calculating materials, and providing real-time guidance.

## User Journey: The 5 Stages of Deck Design

The website guides the user through a seamless, five-stage process on a single scrolling page. A persistent chatbot, acting as an assistant to the salesperson, is available at every stage to provide contextual tips and support.

### Stage 1: Introduction & Chatbot
The user is greeted with a full-screen interactive chatbot that introduces the deck design process. As the user scrolls, the chatbox elegantly shrinks to the corner, remaining accessible throughout the journey.

### Stage 2: Upload Your Deck Plans
Users can upload customer-provided files:
*   **Drawings/Blueprints**: Sketches or professional blueprints with measurements (PDF, PNG, JPEG).
*   **Photos of the Area**: Pictures of the installation site for accurate 3D modeling (JPEG, PNG).

The system features drag-and-drop functionality and performs real-time validation on file types and sizes.

### Stage 3: Analysis & Calculation
The AI backend analyzes the uploaded sketches to automatically extract and display key metrics:
*   Gross Living Area (sq ft)
*   Net Square Footage (sq ft)
*   Linear Railing Footage (ft)
*   Stair Cutouts

An overlay on the sketch visualizes the calculated dimensions, with options for manual adjustments to ensure accuracy.

### Stage 4: Your Digital Blueprint
A clean, digital 2D blueprint is generated from the analyzed sketch. This interactive canvas allows for edits, such as adding or modifying deck elements like railings and stairs. The blueprint can be downloaded in PDF, JPEG, or SVG formats.

### Stage 5: 3D Deck Preview
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

## Deployment Options

### Local Development
See the "Running the Project Locally" section above for local development setup.

### AWS Cloud Deployment
Deploy DeckChatbot to AWS using ECS Fargate for production-ready scalability:

1. **Prerequisites**:
   - AWS CLI installed and configured
   - Docker installed
   - SSL certificate in AWS Certificate Manager
   - Domain name (recommended)

2. **Quick AWS Deployment**:
   ```bash
   # Set required environment variables
   export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
   export DOMAIN_NAME=your-domain.com

   # Run deployment script
   cd aws/scripts
   chmod +x *.sh
   ./deploy.sh
   ```

3. **AWS Architecture**:
   - **ECS Fargate**: Containerized services with auto-scaling
   - **Application Load Balancer**: SSL termination and traffic routing
   - **VPC**: Secure network with public/private subnets
   - **ECR**: Container image registry
   - **CloudWatch**: Logging and monitoring
   - **Parameter Store**: Secure configuration management

4. **Cost Estimation**: ~$120-230/month (varies by usage)

For detailed AWS deployment instructions, see:
- **Step-by-Step Guide**: [`docs/aws-step-by-step-guide.md`](docs/aws-step-by-step-guide.md) - Complete walkthrough for beginners
- **Quick Reference**: [`docs/aws-quick-reference.md`](docs/aws-quick-reference.md) - Essential commands and troubleshooting
- **Technical Details**: [`aws/README.md`](aws/README.md) - Advanced configuration and architecture

### Cost-Effective Alternatives

**Looking for cheaper hosting options?** The AWS deployment above costs $120-230/month, but there are much more affordable alternatives:

#### 🚀 Hetzner Cloud (RECOMMENDED) - **$4.15/month**
**Perfect for production use with excellent performance and value!**

Since you've already created your Hetzner Cloud account, here are your next steps:

**Quick Start (Automated):**
1. Create a server in your [Hetzner Console](https://console.hetzner.com/projects)
2. SSH into your server: `ssh root@YOUR_SERVER_IP`
3. Run the automated deployment script:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/deckchatbot-monorepo/main/scripts/deploy-hetzner.sh | bash
   ```

**Manual Setup:**
Follow the comprehensive step-by-step guide: [`docs/hetzner-deployment-guide.md`](docs/hetzner-deployment-guide.md)

**Need SSH Help?**
New to SSH or need to set up SSH keys? See: [`docs/ssh-setup-guide.md`](docs/ssh-setup-guide.md)

**What you get:**
- ✅ Full production environment
- ✅ SSL certificates (HTTPS)
- ✅ Custom domain support
- ✅ Automatic security hardening
- ✅ Only $4.15/month!

#### Render.com (FREE) - **$0/month**
Deploy for free using the pre-configured `render.yaml`:
1. Create a [Render account](https://render.com)
2. Connect your GitHub repository
3. Render automatically detects the configuration
4. All services deploy on the free tier

#### Self-Hosted VPS - **$5-10/month**
Use the existing Docker Compose setup on a VPS:
```bash
# On your VPS (Ubuntu/Debian)
git clone your-repo
cd deckchatbot-monorepo/docker
docker-compose up -d
```

**📋 Complete Cost Comparison**: See [`docs/cost-effective-deployment-alternatives.md`](docs/cost-effective-deployment-alternatives.md) for detailed comparison of all hosting options, from FREE to enterprise-grade.

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
