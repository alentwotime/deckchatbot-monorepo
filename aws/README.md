# DeckChatbot AWS Deployment Guide

This directory contains all the necessary files and scripts to deploy the DeckChatbot application to AWS using ECS Fargate, Application Load Balancer, and other AWS services.

## Architecture Overview

The AWS deployment consists of:

- **ECS Fargate**: Containerized services (frontend, backend, ai-service)
- **Application Load Balancer**: Routes traffic to services
- **ECR**: Container image registry
- **VPC**: Isolated network with public/private subnets
- **CloudWatch**: Logging and monitoring
- **Systems Manager Parameter Store**: Configuration management
- **Service Discovery**: Internal service communication

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured
2. **Docker** installed and running
3. **jq** installed (for JSON parsing)
4. **AWS Account** with appropriate permissions
5. **SSL Certificate** in AWS Certificate Manager
6. **Domain name** (optional, but recommended)

### Required AWS Permissions

Your AWS user/role needs the following permissions:
- ECS full access
- ECR full access
- CloudFormation full access
- VPC full access
- IAM role creation
- Systems Manager Parameter Store access
- CloudWatch Logs access
- Application Load Balancer access

## Quick Start

1. **Set environment variables:**
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT=production
export DOMAIN_NAME=your-domain.com
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
```

2. **Run the deployment script:**
```bash
cd aws/scripts
chmod +x *.sh
./deploy.sh
```

3. **Point your domain to the Load Balancer DNS** (output from the script)

4. **Update sensitive parameters:**
```bash
# If using OpenAI
aws ssm put-parameter --name '/deckchatbot/openai-api-key' --value 'your-openai-key' --type SecureString --overwrite

# If using Hugging Face
aws ssm put-parameter --name '/deckchatbot/hf-api-token' --value 'your-hf-token' --type SecureString --overwrite
```

## Directory Structure

```
aws/
├── cloudformation/
│   ├── infrastructure.yaml    # VPC, ALB, ECS cluster, security groups
│   └── services.yaml         # ECS services and task definitions
├── ecs-task-definitions/
│   ├── frontend-task.json    # Frontend task definition
│   ├── backend-task.json     # Backend task definition
│   └── ai-service-task.json  # AI service task definition
├── scripts/
│   ├── deploy.sh            # Main deployment script
│   ├── setup-ecr.sh         # ECR repositories setup
│   └── setup-parameters.sh  # Parameter Store setup
└── README.md               # This file
```

## Detailed Deployment Steps

### 1. ECR Setup

Creates Docker image repositories:
```bash
./scripts/setup-ecr.sh
```

This creates three repositories:
- `deckchatbot-frontend`
- `deckchatbot-backend`
- `deckchatbot-ai-service`

### 2. Parameter Store Setup

Creates application configuration parameters:
```bash
./scripts/setup-parameters.sh
```

Parameters created:
- `/deckchatbot/ai-provider`
- `/deckchatbot/ollama-model-name`
- `/deckchatbot/openai-api-key`
- `/deckchatbot/hf-api-token`
- And more...

### 3. Infrastructure Deployment

Deploys the base infrastructure:
```bash
aws cloudformation deploy \
  --template-file cloudformation/infrastructure.yaml \
  --stack-name deckchatbot-infrastructure \
  --parameter-overrides \
    Environment=production \
    DomainName=your-domain.com \
    CertificateArn=your-cert-arn \
  --capabilities CAPABILITY_NAMED_IAM
```

### 4. Services Deployment

Deploys the ECS services:
```bash
aws cloudformation deploy \
  --template-file cloudformation/services.yaml \
  --stack-name deckchatbot-services \
  --parameter-overrides \
    InfrastructureStackName=deckchatbot-infrastructure \
    Environment=production \
    ImageTag=latest \
    AccountId=123456789012 \
    Region=us-east-1 \
  --capabilities CAPABILITY_IAM
```

## Environment Variables

### Required
- `CERTIFICATE_ARN`: SSL certificate ARN from AWS Certificate Manager

### Optional
- `AWS_REGION`: AWS region (default: us-east-1)
- `ENVIRONMENT`: Environment name (default: production)
- `IMAGE_TAG`: Docker image tag (default: latest)
- `DOMAIN_NAME`: Your domain name (default: deckchatbot.com)

## SSL Certificate Setup

1. **Request a certificate in AWS Certificate Manager:**
```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names www.your-domain.com \
  --validation-method DNS \
  --region us-east-1
```

2. **Validate the certificate** by adding the DNS records to your domain

3. **Get the certificate ARN:**
```bash
aws acm list-certificates --region us-east-1
```

## Monitoring and Troubleshooting

### View Service Status
```bash
aws ecs list-services --cluster deckchatbot-infrastructure-cluster
aws ecs describe-services --cluster deckchatbot-infrastructure-cluster --services production-frontend production-backend production-ai-service
```

### View Logs
```bash
# Frontend logs
aws logs tail /ecs/deckchatbot-frontend --follow

# Backend logs
aws logs tail /ecs/deckchatbot-backend --follow

# AI Service logs
aws logs tail /ecs/deckchatbot-ai-service --follow
```

### Check Load Balancer Health
```bash
aws elbv2 describe-target-health --target-group-arn your-target-group-arn
```

### Access Container Shell
```bash
aws ecs execute-command \
  --cluster deckchatbot-infrastructure-cluster \
  --task task-id \
  --container frontend \
  --interactive \
  --command "/bin/sh"
```

## Scaling

### Manual Scaling
```bash
aws ecs update-service \
  --cluster deckchatbot-infrastructure-cluster \
  --service production-frontend \
  --desired-count 4
```

### Auto Scaling
Auto scaling is configured in the services CloudFormation template:
- Target CPU utilization: 70%
- Min capacity: 2
- Max capacity: 10

## Cost Optimization

### Use Fargate Spot
The deployment uses a mix of Fargate and Fargate Spot (80% Spot, 20% On-Demand) to reduce costs.

### Resource Limits
- Frontend: 256 CPU, 512 MB memory
- Backend: 512 CPU, 1024 MB memory
- AI Service: 1024 CPU, 2048 MB memory

### Log Retention
CloudWatch logs are retained for 30 days to control costs.

## Security Features

- **VPC with private subnets** for ECS tasks
- **Security groups** with minimal required access
- **IAM roles** with least privilege principle
- **Secrets management** via Parameter Store
- **Container security** with read-only root filesystem
- **SSL/TLS termination** at load balancer

## Backup and Disaster Recovery

### Database Backup
If using RDS (not included in this setup), enable automated backups.

### Configuration Backup
Parameter Store values are backed up as part of CloudFormation templates.

### Multi-AZ Deployment
Services are deployed across multiple Availability Zones for high availability.

## Updating the Application

### Deploy New Version
```bash
export IMAGE_TAG=v1.2.3
./scripts/deploy.sh
```

### Rolling Updates
ECS performs rolling updates automatically:
- Maximum 200% capacity during deployment
- Minimum 50% healthy capacity maintained

### Rollback
```bash
aws ecs update-service \
  --cluster deckchatbot-infrastructure-cluster \
  --service production-frontend \
  --task-definition production-deckchatbot-frontend:previous-revision
```

## Cleanup

To remove all AWS resources:

```bash
# Delete services stack
aws cloudformation delete-stack --stack-name deckchatbot-services

# Wait for services to be deleted
aws cloudformation wait stack-delete-complete --stack-name deckchatbot-services

# Delete infrastructure stack
aws cloudformation delete-stack --stack-name deckchatbot-infrastructure

# Delete ECR repositories (optional)
aws ecr delete-repository --repository-name deckchatbot-frontend --force
aws ecr delete-repository --repository-name deckchatbot-backend --force
aws ecr delete-repository --repository-name deckchatbot-ai-service --force

# Delete parameters (optional)
aws ssm delete-parameters-by-path --path "/deckchatbot" --recursive
```

## Support

For issues with the AWS deployment:

1. Check CloudFormation events in AWS Console
2. Review ECS service events
3. Check CloudWatch logs
4. Verify security group rules
5. Ensure Parameter Store values are correct

## Cost Estimation

Approximate monthly costs (us-east-1):
- ECS Fargate: $50-150 (depending on usage)
- Application Load Balancer: $20
- NAT Gateways: $45 (2 AZs)
- CloudWatch Logs: $5-15
- **Total: ~$120-230/month**

*Costs may vary based on actual usage and AWS pricing changes.*
