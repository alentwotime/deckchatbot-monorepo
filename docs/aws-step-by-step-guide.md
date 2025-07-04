# DeckChatbot AWS Step-by-Step Deployment Guide

## What You'll Build: Complete AWS Architecture for One Main Website

This guide will walk you through creating **exactly** what AWS services you need to get your DeckChatbot application running on one main website (e.g., `https://yourdomain.com`).

## 🎯 End Goal
- **One main website URL** that serves your entire DeckChatbot application
- **Automatic scaling** based on traffic
- **SSL/HTTPS security** with your own domain
- **Professional infrastructure** that can handle production traffic
- **Cost-effective** setup (~$120-230/month)

## 📋 AWS Services You'll Create (In Order)

### 1. **AWS Certificate Manager (ACM)** - SSL Certificate
**Purpose**: Provides HTTPS security for your website
**What it does**: Encrypts traffic between users and your website

### 2. **Elastic Container Registry (ECR)** - Docker Image Storage
**Purpose**: Stores your application's Docker images
**What it does**: Like a private Docker Hub for your app components

### 3. **Virtual Private Cloud (VPC)** - Network Foundation
**Purpose**: Creates an isolated network for your application
**What it does**: Like having your own private data center in AWS

### 4. **Application Load Balancer (ALB)** - Traffic Router
**Purpose**: Routes incoming traffic to the right parts of your application
**What it does**: Acts as the front door to your website

### 5. **Elastic Container Service (ECS)** - Application Runner
**Purpose**: Runs your application containers
**What it does**: Manages and scales your frontend, backend, and AI services

### 6. **Systems Manager Parameter Store** - Configuration Storage
**Purpose**: Securely stores API keys and configuration
**What it does**: Keeps sensitive information safe and accessible to your app

### 7. **CloudWatch** - Monitoring and Logs
**Purpose**: Monitors your application and stores logs
**What it does**: Helps you see what's happening and troubleshoot issues

---

## 🚀 Step-by-Step Implementation

### Prerequisites (Do This First)

1. **Create AWS Account**
   - Go to [aws.amazon.com](https://aws.amazon.com)
   - Sign up for an account
   - Add a payment method (you'll get free tier benefits)

2. **Install Required Tools**
   ```bash
   # Install AWS CLI
   # Windows: Download from https://aws.amazon.com/cli/
   # Mac: brew install awscli
   # Linux: sudo apt install awscli
   
   # Install Docker Desktop
   # Download from https://www.docker.com/products/docker-desktop
   
   # Install jq (JSON processor)
   # Windows: Download from https://stedolan.github.io/jq/
   # Mac: brew install jq
   # Linux: sudo apt install jq
   ```

3. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your preferred region (e.g., us-east-1)
   # Enter output format: json
   ```

4. **Get a Domain Name** (Recommended)
   - Purchase from any domain registrar (GoDaddy, Namecheap, etc.)
   - Or use AWS Route 53 to register a domain

---

### Step 1: Create SSL Certificate (ACM)

**Why**: Your website needs HTTPS for security and SEO

1. **Go to AWS Certificate Manager**
   - Open AWS Console → Search "Certificate Manager"
   - Make sure you're in **us-east-1** region (required for CloudFront)

2. **Request Certificate**
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --subject-alternative-names www.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

3. **Validate Certificate**
   - AWS will provide DNS records to add to your domain
   - Add these records in your domain registrar's DNS settings
   - Wait for validation (5-30 minutes)

4. **Save Certificate ARN**
   ```bash
   aws acm list-certificates --region us-east-1
   # Copy the CertificateArn - you'll need this later
   ```

---

### Step 2: Set Up Container Registry (ECR)

**Why**: AWS needs somewhere to store your application's Docker images

**Automatic Setup** (Recommended):
```bash
cd aws/scripts
chmod +x setup-ecr.sh
./setup-ecr.sh
```

**Manual Setup**:
1. **Create Repositories**
   ```bash
   aws ecr create-repository --repository-name deckchatbot-frontend
   aws ecr create-repository --repository-name deckchatbot-backend
   aws ecr create-repository --repository-name deckchatbot-ai-service
   ```

2. **Note Repository URIs**
   ```bash
   aws ecr describe-repositories
   # Save the repositoryUri for each - you'll need these
   ```

---

### Step 3: Set Up Configuration Storage (Parameter Store)

**Why**: Your app needs secure storage for API keys and settings

**Automatic Setup** (Recommended):
```bash
cd aws/scripts
chmod +x setup-parameters.sh
./setup-parameters.sh
```

**What This Creates**:
- `/deckchatbot/ai-provider` → "ollama"
- `/deckchatbot/ollama-model-name` → "alentwotime/llava-deckbot"
- `/deckchatbot/openai-api-key` → (you'll update this)
- `/deckchatbot/hf-api-token` → (you'll update this)

---

### Step 4: Deploy Core Infrastructure

**Why**: Creates the network, load balancer, and ECS cluster

1. **Set Environment Variables**
   ```bash
   export AWS_REGION=us-east-1
   export ENVIRONMENT=production
   export DOMAIN_NAME=yourdomain.com
   export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
   ```

2. **Deploy Infrastructure**
   ```bash
   aws cloudformation create-stack \
     --stack-name deckchatbot-infrastructure \
     --template-body file://aws/cloudformation/infrastructure.yaml \
     --parameters \
       ParameterKey=Environment,ParameterValue=production \
       ParameterKey=DomainName,ParameterValue=yourdomain.com \
       ParameterKey=CertificateArn,ParameterValue=your-certificate-arn \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Wait for Completion** (10-15 minutes)
   ```bash
   aws cloudformation wait stack-create-complete --stack-name deckchatbot-infrastructure
   ```

**What This Creates**:
- **VPC**: Your private network (10.0.0.0/16)
- **Subnets**: Public (for load balancer) and private (for apps)
- **Internet Gateway**: Connects to the internet
- **NAT Gateways**: Allows private subnets to reach internet
- **Security Groups**: Firewall rules
- **Application Load Balancer**: Routes traffic
- **ECS Cluster**: Container orchestration
- **CloudWatch Log Groups**: For application logs

---

### Step 5: Build and Push Application Images

**Why**: Your application code needs to be packaged and uploaded to AWS

1. **Authenticate Docker with ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   ```

2. **Build and Push Images**
   ```bash
   # Frontend
   docker build -t deckchatbot-frontend:latest -f apps/frontend/Dockerfile .
   docker tag deckchatbot-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-frontend:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-frontend:latest
   
   # Backend
   docker build -t deckchatbot-backend:latest -f apps/backend/Dockerfile .
   docker tag deckchatbot-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-backend:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-backend:latest
   
   # AI Service
   docker build -t deckchatbot-ai-service:latest -f apps/ai-service/Dockerfile .
   docker tag deckchatbot-ai-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-ai-service:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-ai-service:latest
   ```

---

### Step 6: Deploy Application Services

**Why**: This actually runs your application on the infrastructure

1. **Deploy Services Stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name deckchatbot-services \
     --template-body file://aws/cloudformation/services.yaml \
     --parameters \
       ParameterKey=InfrastructureStackName,ParameterValue=deckchatbot-infrastructure \
       ParameterKey=Environment,ParameterValue=production \
       ParameterKey=ImageTag,ParameterValue=latest \
       ParameterKey=AccountId,ParameterValue=123456789012 \
       ParameterKey=Region,ParameterValue=us-east-1 \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

2. **Wait for Completion** (5-10 minutes)
   ```bash
   aws cloudformation wait stack-create-complete --stack-name deckchatbot-services
   ```

**What This Creates**:
- **ECS Services**: Manages your containers
- **Task Definitions**: Defines how containers run
- **Auto Scaling**: Automatically scales based on traffic
- **Service Discovery**: Allows services to find each other

---

### Step 7: Configure Domain and DNS

**Why**: Connect your domain to the AWS load balancer

1. **Get Load Balancer DNS**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name deckchatbot-infrastructure \
     --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
     --output text
   ```

2. **Update Your Domain's DNS**
   - Go to your domain registrar's DNS settings
   - Create a CNAME record:
     - **Name**: `@` (or your domain)
     - **Value**: The load balancer DNS from step 1
     - **TTL**: 300

3. **Create www Subdomain** (Optional)
   - Create another CNAME record:
     - **Name**: `www`
     - **Value**: The load balancer DNS
     - **TTL**: 300

---

### Step 8: Update API Keys and Configuration

**Why**: Your application needs real API keys to function

1. **Update OpenAI API Key** (if using OpenAI)
   ```bash
   aws ssm put-parameter \
     --name '/deckchatbot/openai-api-key' \
     --value 'your-actual-openai-api-key' \
     --type SecureString \
     --overwrite
   ```

2. **Update Hugging Face Token** (if using)
   ```bash
   aws ssm put-parameter \
     --name '/deckchatbot/hf-api-token' \
     --value 'your-actual-hf-token' \
     --type SecureString \
     --overwrite
   ```

---

### Step 9: Test Your Website

**Why**: Verify everything is working correctly

1. **Wait for DNS Propagation** (5-30 minutes)
   ```bash
   nslookup yourdomain.com
   # Should return the load balancer IP
   ```

2. **Test Your Website**
   - Open `https://yourdomain.com` in your browser
   - You should see the DeckChatbot interface
   - Test uploading an image
   - Test the chatbot functionality

3. **Check Service Health**
   ```bash
   aws ecs describe-services \
     --cluster deckchatbot-infrastructure-cluster \
     --services production-frontend production-backend production-ai-service
   ```

---

## 🔧 One-Command Deployment (Alternative)

If you want to do everything automatically:

```bash
# Set required environment variables
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
export DOMAIN_NAME=yourdomain.com

# Run the complete deployment script
cd aws/scripts
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Set up ECR repositories
2. Configure Parameter Store
3. Build and push Docker images
4. Deploy infrastructure
5. Deploy services
6. Provide you with the load balancer DNS

---

## 💰 Cost Breakdown

**Monthly Costs (US East 1)**:
- **ECS Fargate**: $50-150 (depends on traffic)
- **Application Load Balancer**: $20
- **NAT Gateways**: $45 (2 availability zones)
- **CloudWatch Logs**: $5-15
- **ECR Storage**: $1-5
- **Parameter Store**: Free (under 10,000 parameters)
- **Certificate Manager**: Free

**Total: ~$120-230/month**

**Cost Optimization Tips**:
- Use Fargate Spot instances (included in templates)
- Set up CloudWatch alarms to scale down during low traffic
- Use lifecycle policies to clean up old Docker images

---

## 🚨 Troubleshooting

### Website Not Loading
1. **Check DNS**: `nslookup yourdomain.com`
2. **Check Load Balancer**: Visit the ALB DNS directly
3. **Check ECS Services**: Ensure all services are running

### Services Not Starting
1. **Check Logs**:
   ```bash
   aws logs tail /ecs/deckchatbot-frontend --follow
   aws logs tail /ecs/deckchatbot-backend --follow
   aws logs tail /ecs/deckchatbot-ai-service --follow
   ```

2. **Check Task Definitions**: Ensure images exist in ECR

### SSL Certificate Issues
1. **Verify Certificate**: Check it's validated in ACM
2. **Check Region**: Certificate must be in us-east-1
3. **Verify DNS Records**: Ensure validation records are correct

---

## 🔄 Updating Your Application

To deploy new code:

1. **Build New Images**:
   ```bash
   export IMAGE_TAG=v1.1.0
   # Build and push with new tag
   ```

2. **Update Services**:
   ```bash
   aws ecs update-service \
     --cluster deckchatbot-infrastructure-cluster \
     --service production-frontend \
     --force-new-deployment
   ```

---

## 🧹 Cleanup (Delete Everything)

To remove all AWS resources and stop charges:

```bash
# Delete services
aws cloudformation delete-stack --stack-name deckchatbot-services

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name deckchatbot-services

# Delete infrastructure
aws cloudformation delete-stack --stack-name deckchatbot-infrastructure

# Delete ECR repositories
aws ecr delete-repository --repository-name deckchatbot-frontend --force
aws ecr delete-repository --repository-name deckchatbot-backend --force
aws ecr delete-repository --repository-name deckchatbot-ai-service --force
```

---

## 📞 Support

If you run into issues:

1. **Check AWS Console**: Look for error messages in CloudFormation
2. **Review Logs**: Use CloudWatch to see application logs
3. **Verify Permissions**: Ensure your AWS user has required permissions
4. **Check Quotas**: Verify you haven't hit AWS service limits

**Common Issues**:
- **Certificate validation**: Make sure DNS records are added correctly
- **Docker build failures**: Check Dockerfile syntax and dependencies
- **Service startup failures**: Usually related to missing environment variables or API keys

---

This guide gives you a complete, production-ready DeckChatbot website on AWS with professional infrastructure, automatic scaling, and HTTPS security. The entire setup typically takes 1-2 hours for first-time deployment.
