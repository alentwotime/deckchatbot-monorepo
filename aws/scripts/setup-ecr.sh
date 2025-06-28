#!/bin/bash

# DeckChatbot ECR Setup Script
# This script creates ECR repositories for all services

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Setting up ECR repositories for DeckChatbot..."
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Create ECR repositories
REPOSITORIES=("deckchatbot-frontend" "deckchatbot-backend" "deckchatbot-ai-service")

for repo in "${REPOSITORIES[@]}"; do
    echo "Creating ECR repository: $repo"
    
    # Check if repository already exists
    if aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" >/dev/null 2>&1; then
        echo "Repository $repo already exists"
    else
        # Create repository
        aws ecr create-repository \
            --repository-name "$repo" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        
        echo "Created repository: $repo"
    fi
    
    # Set lifecycle policy to keep only the latest 10 images
    aws ecr put-lifecycle-policy \
        --repository-name "$repo" \
        --region "$AWS_REGION" \
        --lifecycle-policy-text '{
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep only the latest 10 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        }'
    
    echo "Set lifecycle policy for repository: $repo"
done

echo "ECR setup completed successfully!"
echo ""
echo "Repository URIs:"
for repo in "${REPOSITORIES[@]}"; do
    echo "$repo: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo"
done

echo ""
echo "To authenticate Docker with ECR, run:"
echo "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
