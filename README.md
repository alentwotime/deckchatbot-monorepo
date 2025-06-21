# Chatbot Greeting

The assistant starts by asking the user what type of deck job they need (new deck, resurfacing, etc.)

1. Upload Phase
Users upload:

Photos of deck/home area

Blueprint or sketch drawings with measurements and directional markers

1. Image Naming Guide
Use clear file names to help the AI:

Include terms like deck, sketch, layout, or measurements (12x16ft)

Use .png or .jpg

Avoid spaces, emojis, or generic names

Example filenames:

deck-sketch_L-shape_22x16ft.jpg

## User Journey Overview

deck-blueprint_marked-door-stairs.png

4. Image + Drawing Analysis
AI backend uses OCR and vision models to:

Extract deck outline and dimensions

Identify features like doors, stairs, and elevation

Normalize sketches to scale

5. 2D Deck Generation
Creates a clean, digital 2D deck layout from the sketch.

6. Bot Follow-Up
Chatbot asks any missing questions, like deck height or preferred materials.

7. 3D Visualization
Generates a 3D deck model overlayed on the house photo for client presentation.

📸 DeckChatbot Vision Input Guide
Required Uploads
Graph Paper Sketch (Mandatory):

Drawn to scale with all outer measurements labeled

Mark stairs, doors, deck height clearly

Photos of Area (Optional but Recommended):

Back of house or current deck condition

Taken from slight angle for 3D effect

Format & Size
Type Format Max Size
Drawings JPG, PNG, PDF 15MB
Real Photos JPG, PNG 15MB

Tips for Best Results
Use natural daylight, avoid shadows

Ensure graph paper edges visible and flat

Use dark ink or pencil, avoid faint markers

🚀 Getting Started
Prerequisites
Node.js 18+

Python 3.10+

Poetry package manager

Frontend Setup
bash
Copy
cd frontend
npm install
npm run dev
Backend AI Setup
bash
Copy
cd apps/app1
poetry install --no-root
poetry run uvicorn API.api:app --reload
Quick Local Run
From repo root:

bash
Copy
./run.sh
Docker Compose
Build and run all services locally:

bash
Copy
docker compose up --build
Access:

Frontend → <http://localhost:3000>

Backend → <http://localhost:8000>

☁️ Deploying to Azure

When deploying to Azure, always follow [Azure code generation and deployment best practices](https://learn.microsoft.com/en-us/azure/developer/dev-best-practices/) to ensure secure, scalable, and maintainable applications. Key recommendations include using infrastructure-as-code (e.g., Bicep or ARM templates), managing secrets with Azure Key Vault, enabling monitoring and logging, and automating deployments with CI/CD pipelines.

**Using Azure Container Registry & Container Apps**

Ensure you have environment variables:

🔑 Environment Variables
Variable Description
OPENAI_API_KEY Your OpenAI API key for AI services
NODE_ENV Set to production in production
PORT Port for backend or frontend server

🔧 Useful Commands
Command Description
npm run dev Start frontend in dev mode
poetry run uvicorn ... Start backend AI FastAPI server
docker compose up --build Build & run all services in Docker
az acr build ... Build Docker images in Azure ACR
az containerapp create ... Deploy container app to Azure

💡 Troubleshooting & Notes
After upgrading to Windows 11 Pro, ensure Node, Python, and Docker are updated and compatible.

If dependencies fail to install, try clearing caches (npm cache clean --force, poetry cache clear).

When running in Azure Cloud Shell, verify your subscription and tenant are correctly set (az account list, az account set).

For Docker issues, ensure Docker Desktop has sufficient resources allocated and uses WSL 2 backend.

If environment variables are missing, the app will not start—double-check .env files or Azure app settings.

🔭 Future Features
AI-assisted sketch correction

Auto-detect stair orientation from arrows

Support multiple deck shapes (L-shape, octagon, etc.)

Photo background blending in 3D renders

☁️ Detailed Azure Deployment Guide
Prerequisites
Azure CLI installed and logged in (az login)

Azure subscription with permission to create resources

Azure Container Registry (ACR) created

Azure Resource Group created

Docker Desktop installed and running

Step 1: Log in to Azure
bash
Copy
az login
This opens a browser window to authenticate your account.

☁️ Detailed Azure Deployment Guide

## Security Best Practices for Azure Deployments

- **Manage Secrets Securely:** Never hard-code secrets or credentials in your code or Docker images. Use Azure Key Vault or Azure App Service/Container App environment variables to securely store and access sensitive information like API keys.
- **Use Managed Identities:** Enable [Azure Managed Identities](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview) for your container apps or VMs to securely access Azure resources without storing credentials in code.
- **Restrict Network Access:** Use Azure networking features such as Private Endpoints, VNET integration, and firewall rules to limit access to your services.
- **Monitor and Audit:** Enable logging and monitoring with Azure Monitor and set up alerts for suspicious activities.
- **Regularly Update Dependencies:** Keep your base images and dependencies up to date to mitigate vulnerabilities.

Prerequisites
Azure CLI installed and logged in (az login)

Azure subscription with permission to create resources
export AZURE_RG="<your-resource-group>"
export ACR_NAME="<your-acr-name>"
export LOCATION="eastus"  # or your preferred region
Step 3: Build and push Docker images to Azure Container Registry (ACR)
bash
Copy
az acr build --registry $ACR_NAME --image deckchatbot-backend:latest -f Dockerfile .
az acr build --registry $ACR_NAME --image deckchatbot-frontend:latest -f frontend/Dockerfile ./frontend
These commands build your Docker images in Azure and push them to your private ACR.

Step 4: Create Azure Container Apps for backend and frontend
bash
Copy
az containerapp create \
  --name deckchatbot-backend-app \
  --resource-group $AZURE_RG \
  --image $ACR_NAME.azurecr.io/deckchatbot-backend:latest \
  --target-port 8000

az containerapp create \
  --name deckchatbot-frontend-app \
  --resource-group $AZURE_RG \
  --image $ACR_NAME.azurecr.io/deckchatbot-frontend:latest \
  --target-port 3000
Step 5: Set environment variables

After your Container Apps are running, configure any required environment variables. For example, set your OpenAI key for the backend app:

```bash
az containerapp env var set \
  --name deckchatbot-backend-app \
  --resource-group $AZURE_RG \
  --env-vars OPENAI_API_KEY=$OPENAI_API_KEY
```

For sensitive data consider storing it securely. You can create a secret for the app:

```bash
az containerapp secret set \
  --name deckchatbot-backend-app \
  --resource-group $AZURE_RG \
  --secrets OPENAI_API_KEY=$OPENAI_API_KEY
```

Then reference the secret as an environment variable, or manage secrets centrally with **Azure Key Vault**.
Screenshot Example
> **Note:** Replace this placeholder with an actual screenshot of your Azure Portal Container Apps page before releasing this documentation.
[Add a screenshot showing the Azure Portal Container Apps page with your deployed apps here]

Screenshot Example
[Add a screenshot showing the Azure Portal Container Apps page with your deployed apps here]

🐳 Dockerfile and Docker Compose Explained
Backend Dockerfile (Dockerfile)
```Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
EXPOSE ${PORT}
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "${PORT}"]
```
Explanation:

Uses slim Python image for smaller size

Installs Poetry to manage Python dependencies

Copies app code into container

Exposes port 8000 where FastAPI runs

Runs Uvicorn to serve the backend

Frontend Dockerfile (frontend/Dockerfile)
Dockerfile
Copy
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
Explanation:

Uses lightweight Node.js 18 image

Installs npm dependencies

Copies frontend source code

Runs development server on port 3000

Docker Compose (docker-compose.yml)
yaml
Copy
version: "3.9"

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
Explanation:

Defines two services: backend and frontend

Builds each from their respective Dockerfiles

Maps local ports 8000 and 3000 to container ports

Passes environment variables (e.g., OPENAI_API_KEY) to backend

🔑 Environment Variable Management Tips

1. Local Development
Create .env files in root or in each service folder

Add sensitive keys like OPENAI_API_KEY=your_key_here

Use tools like dotenv in Node.js or python-dotenv in Python to load .env

2. Docker Environment Variables
Pass .env values to Docker Compose using env_file or environment sections

Example in docker-compose.yml:

yaml
Copy
services:
  backend:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
Then run export OPENAI_API_KEY=your_key before starting containers

3. Azure Environment Variables
Set environment variables in Azure portal or CLI for Container Apps and Web Apps

They become available to your app’s runtime environment just like .env

👨‍💻 Built By
AlenTwoTime
GitHub: @alentwotime

📄 License
MIT License
