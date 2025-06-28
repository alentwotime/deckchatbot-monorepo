#!/bin/bash

# DeckChatbot Parameter Store Setup Script
# This script creates SSM parameters for application configuration

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}

echo "Setting up AWS Systems Manager Parameter Store for DeckChatbot..."
echo "AWS Region: $AWS_REGION"

# Function to create or update parameter
create_parameter() {
    local name=$1
    local value=$2
    local type=${3:-String}
    local description=$4
    
    echo "Creating/updating parameter: $name"
    
    # Check if parameter exists
    if aws ssm get-parameter --name "$name" --region "$AWS_REGION" >/dev/null 2>&1; then
        # Update existing parameter
        aws ssm put-parameter \
            --name "$name" \
            --value "$value" \
            --type "$type" \
            --description "$description" \
            --overwrite \
            --region "$AWS_REGION"
        echo "Updated parameter: $name"
    else
        # Create new parameter
        aws ssm put-parameter \
            --name "$name" \
            --value "$value" \
            --type "$type" \
            --description "$description" \
            --region "$AWS_REGION"
        echo "Created parameter: $name"
    fi
}

# Create parameters
echo ""
echo "Creating application configuration parameters..."

# AI Provider Configuration
create_parameter \
    "/deckchatbot/ai-provider" \
    "ollama" \
    "String" \
    "AI provider to use (ollama or openai)"

create_parameter \
    "/deckchatbot/ollama-model-name" \
    "alentwotime/llava-deckbot" \
    "String" \
    "Ollama model name for AI processing"

create_parameter \
    "/deckchatbot/ollama-base-url" \
    "http://localhost:11434" \
    "String" \
    "Base URL for Ollama service"

# OpenAI Configuration (placeholder - user should update with actual key)
create_parameter \
    "/deckchatbot/openai-api-key" \
    "REPLACE_WITH_YOUR_OPENAI_API_KEY" \
    "SecureString" \
    "OpenAI API key for AI processing"

# Hugging Face Configuration (placeholder - user should update with actual token)
create_parameter \
    "/deckchatbot/hf-api-token" \
    "REPLACE_WITH_YOUR_HF_TOKEN" \
    "SecureString" \
    "Hugging Face API token for image enhancement"

# Database Configuration
create_parameter \
    "/deckchatbot/database-url" \
    "sqlite:///app/data/deckchatbot.db" \
    "String" \
    "Database connection URL"

# Application Configuration
create_parameter \
    "/deckchatbot/environment" \
    "production" \
    "String" \
    "Application environment (development, staging, production)"

create_parameter \
    "/deckchatbot/log-level" \
    "info" \
    "String" \
    "Application log level"

create_parameter \
    "/deckchatbot/cors-origins" \
    "https://deckchatbot.com,https://www.deckchatbot.com" \
    "String" \
    "Allowed CORS origins (comma-separated)"

echo ""
echo "Parameter Store setup completed successfully!"
echo ""
echo "⚠️  IMPORTANT: Please update the following parameters with your actual values:"
echo "   - /deckchatbot/openai-api-key (if using OpenAI)"
echo "   - /deckchatbot/hf-api-token (if using Hugging Face)"
echo ""
echo "To update a parameter, run:"
echo "aws ssm put-parameter --name '/deckchatbot/PARAMETER_NAME' --value 'YOUR_VALUE' --type SecureString --overwrite --region $AWS_REGION"
echo ""
echo "To view all parameters:"
echo "aws ssm get-parameters-by-path --path '/deckchatbot' --recursive --region $AWS_REGION"
