#!/bin/bash

# DeckChatbot AWS Deployment Script
# This script deploys the entire DeckChatbot application to AWS

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${ENVIRONMENT:-production}
IMAGE_TAG=${IMAGE_TAG:-latest}
DOMAIN_NAME=${DOMAIN_NAME:-deckchatbot.com}
CERTIFICATE_ARN=${CERTIFICATE_ARN}

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check if certificate ARN is provided
    if [ -z "$CERTIFICATE_ARN" ]; then
        print_error "CERTIFICATE_ARN environment variable is required."
        print_error "Please set it to your SSL certificate ARN from AWS Certificate Manager."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup ECR repositories
setup_ecr() {
    print_status "Setting up ECR repositories..."
    bash "$(dirname "$0")/setup-ecr.sh"
    print_success "ECR repositories setup completed"
}

# Function to setup parameter store
setup_parameters() {
    print_status "Setting up Parameter Store..."
    bash "$(dirname "$0")/setup-parameters.sh"
    print_success "Parameter Store setup completed"
}

# Function to build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Authenticate Docker with ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build and push each service
    SERVICES=("frontend" "backend" "ai-service")
    
    for service in "${SERVICES[@]}"; do
        print_status "Building $service..."
        
        # Build image
        docker build -t "deckchatbot-$service:$IMAGE_TAG" -f "apps/$service/Dockerfile" .
        
        # Tag for ECR
        docker tag "deckchatbot-$service:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/deckchatbot-$service:$IMAGE_TAG"
        
        # Push to ECR
        docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/deckchatbot-$service:$IMAGE_TAG"
        
        print_success "Built and pushed $service"
    done
    
    print_success "All images built and pushed successfully"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure stack..."
    
    STACK_NAME="deckchatbot-infrastructure"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_status "Updating existing infrastructure stack..."
        aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://aws/cloudformation/infrastructure.yaml \
            --parameters \
                ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                ParameterKey=CertificateArn,ParameterValue="$CERTIFICATE_ARN" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$AWS_REGION"
        
        # Wait for stack update to complete
        aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
    else
        print_status "Creating new infrastructure stack..."
        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://aws/cloudformation/infrastructure.yaml \
            --parameters \
                ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
                ParameterKey=CertificateArn,ParameterValue="$CERTIFICATE_ARN" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$AWS_REGION"
        
        # Wait for stack creation to complete
        aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
    fi
    
    print_success "Infrastructure stack deployed successfully"
}

# Function to deploy services
deploy_services() {
    print_status "Deploying services stack..."
    
    STACK_NAME="deckchatbot-services"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_status "Updating existing services stack..."
        aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://aws/cloudformation/services.yaml \
            --parameters \
                ParameterKey=InfrastructureStackName,ParameterValue="deckchatbot-infrastructure" \
                ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                ParameterKey=ImageTag,ParameterValue="$IMAGE_TAG" \
                ParameterKey=AccountId,ParameterValue="$AWS_ACCOUNT_ID" \
                ParameterKey=Region,ParameterValue="$AWS_REGION" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION"
        
        # Wait for stack update to complete
        aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
    else
        print_status "Creating new services stack..."
        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://aws/cloudformation/services.yaml \
            --parameters \
                ParameterKey=InfrastructureStackName,ParameterValue="deckchatbot-infrastructure" \
                ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                ParameterKey=ImageTag,ParameterValue="$IMAGE_TAG" \
                ParameterKey=AccountId,ParameterValue="$AWS_ACCOUNT_ID" \
                ParameterKey=Region,ParameterValue="$AWS_REGION" \
            --capabilities CAPABILITY_IAM \
            --region "$AWS_REGION"
        
        # Wait for stack creation to complete
        aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
    fi
    
    print_success "Services stack deployed successfully"
}

# Function to get deployment outputs
get_deployment_info() {
    print_status "Getting deployment information..."
    
    # Get ALB DNS name
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name "deckchatbot-infrastructure" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
        --output text)
    
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "=== Deployment Information ==="
    echo "Environment: $ENVIRONMENT"
    echo "AWS Region: $AWS_REGION"
    echo "AWS Account ID: $AWS_ACCOUNT_ID"
    echo "Image Tag: $IMAGE_TAG"
    echo "Load Balancer DNS: $ALB_DNS"
    echo ""
    echo "=== Next Steps ==="
    echo "1. Point your domain ($DOMAIN_NAME) to the Load Balancer DNS: $ALB_DNS"
    echo "2. Update the following parameters with your actual values:"
    echo "   - /deckchatbot/openai-api-key (if using OpenAI)"
    echo "   - /deckchatbot/hf-api-token (if using Hugging Face)"
    echo "3. Monitor the deployment in the AWS Console"
    echo ""
    echo "=== Useful Commands ==="
    echo "View ECS services:"
    echo "aws ecs list-services --cluster deckchatbot-infrastructure-cluster --region $AWS_REGION"
    echo ""
    echo "View service logs:"
    echo "aws logs tail /ecs/deckchatbot-frontend --follow --region $AWS_REGION"
    echo "aws logs tail /ecs/deckchatbot-backend --follow --region $AWS_REGION"
    echo "aws logs tail /ecs/deckchatbot-ai-service --follow --region $AWS_REGION"
}

# Main deployment function
main() {
    echo "========================================"
    echo "DeckChatbot AWS Deployment Script"
    echo "========================================"
    echo "Environment: $ENVIRONMENT"
    echo "AWS Region: $AWS_REGION"
    echo "Image Tag: $IMAGE_TAG"
    echo "Domain: $DOMAIN_NAME"
    echo "========================================"
    echo ""
    
    check_prerequisites
    setup_ecr
    setup_parameters
    build_and_push_images
    deploy_infrastructure
    deploy_services
    get_deployment_info
}

# Run main function
main "$@"
