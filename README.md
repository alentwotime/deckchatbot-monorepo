# DeckChatbot Monorepo

This repository contains the code for the DeckChatbot project. The
monorepo is organized into three top level folders:

- **backend** – Node.js Express API exposing REST endpoints
- **frontend** – React application that interacts with the API
- **backend-ai** – Python service used to run AI models

The project targets deployments on Azure using Docker containers and VM
instances for running AI models.

## Getting Started

Install dependencies and start each service during development:

```bash
# Backend API
cd backend && npm install
npm run dev

# Frontend
cd ../frontend && npm install
npm start
```

The AI service can be run locally with Python:

```bash
cd ../backend-ai
pip install -r requirements.txt
python app.py
```

## Deployment

`backend-ai/cloud-init.yaml` provides a simple setup script for an Azure
VM. It installs Docker and runs the AI service container. Adjust the image
name as needed.

`azure-pipelines.yml` demonstrates how CI/CD could be configured using
Azure Pipelines.

## Repository Structure

```
backend/       Node.js Express API
frontend/      React web application
backend-ai/    Python FastAPI service for AI models
```
