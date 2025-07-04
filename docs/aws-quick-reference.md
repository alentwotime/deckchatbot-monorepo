# AWS Quick Reference for DeckChatbot

## 🚀 One-Command Deployment

```bash
# Prerequisites: AWS CLI configured, Docker installed, SSL certificate created
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
export DOMAIN_NAME=yourdomain.com

cd aws/scripts
chmod +x deploy.sh
./deploy.sh
```

## 📋 AWS Services Created

| Service | Purpose | Monthly Cost |
|---------|---------|--------------|
| **ECS Fargate** | Runs your application containers | $50-150 |
| **Application Load Balancer** | Routes traffic to your website | $20 |
| **ECR** | Stores Docker images | $1-5 |
| **VPC + NAT Gateways** | Network infrastructure | $45 |
| **CloudWatch** | Logging and monitoring | $5-15 |
| **Parameter Store** | Secure configuration storage | Free |
| **Certificate Manager** | SSL/HTTPS certificates | Free |
| **Total** | | **$120-230/month** |

## 🔧 Essential Commands

### Check Deployment Status
```bash
# Check ECS services
aws ecs describe-services --cluster deckchatbot-infrastructure-cluster --services production-frontend production-backend production-ai-service

# Get load balancer DNS
aws cloudformation describe-stacks --stack-name deckchatbot-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' --output text
```

### View Logs
```bash
aws logs tail /ecs/deckchatbot-frontend --follow
aws logs tail /ecs/deckchatbot-backend --follow
aws logs tail /ecs/deckchatbot-ai-service --follow
```

### Update API Keys
```bash
# OpenAI API Key
aws ssm put-parameter --name '/deckchatbot/openai-api-key' --value 'your-key' --type SecureString --overwrite

# Hugging Face Token
aws ssm put-parameter --name '/deckchatbot/hf-api-token' --value 'your-token' --type SecureString --overwrite
```

### Scale Services
```bash
# Scale frontend to 4 instances
aws ecs update-service --cluster deckchatbot-infrastructure-cluster --service production-frontend --desired-count 4
```

### Deploy New Version
```bash
# Build and push new images
export IMAGE_TAG=v1.1.0
docker build -t deckchatbot-frontend:$IMAGE_TAG -f apps/frontend/Dockerfile .
docker tag deckchatbot-frontend:$IMAGE_TAG 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-frontend:$IMAGE_TAG
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/deckchatbot-frontend:$IMAGE_TAG

# Force service update
aws ecs update-service --cluster deckchatbot-infrastructure-cluster --service production-frontend --force-new-deployment
```

## 🚨 Troubleshooting

### Website Not Loading
1. Check DNS: `nslookup yourdomain.com`
2. Visit ALB directly: Use the load balancer DNS
3. Check ECS services are running

### Services Failing
1. Check logs in CloudWatch
2. Verify images exist in ECR
3. Check Parameter Store values
4. Verify IAM permissions

### SSL Issues
1. Certificate must be in us-east-1 region
2. Verify DNS validation records
3. Check certificate status in ACM

## 🧹 Complete Cleanup
```bash
# Delete everything and stop all charges
aws cloudformation delete-stack --stack-name deckchatbot-services
aws cloudformation wait stack-delete-complete --stack-name deckchatbot-services
aws cloudformation delete-stack --stack-name deckchatbot-infrastructure
aws ecr delete-repository --repository-name deckchatbot-frontend --force
aws ecr delete-repository --repository-name deckchatbot-backend --force
aws ecr delete-repository --repository-name deckchatbot-ai-service --force
```

## 📚 Full Documentation
- **Complete Guide**: [AWS Step-by-Step Guide](aws-step-by-step-guide.md)
- **Technical Details**: [AWS README](../aws/README.md)
- **API Documentation**: [API Documentation](api-documentation.md)
