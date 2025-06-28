# CI/CD Pipeline Guide for DeckChatbot

This document provides comprehensive guidance on the CI/CD pipeline implementation for the DeckChatbot project.

## Overview

The DeckChatbot project uses GitHub Actions for continuous integration and deployment. The pipeline includes automated testing, security scanning, code quality checks, and deployment automation across multiple environments.

## Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Push     │    │   Pull Request  │    │   Manual        │
│   (main/develop)│    │   (any branch)  │    │   Trigger       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Trigger CI/CD       │
                    │       Pipeline          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Parallel Testing     │
                    │  ┌─────────────────────┐│
                    │  │ Frontend Tests      ││
                    │  │ Backend Tests       ││
                    │  │ AI Service Tests    ││
                    │  │ Linting & Quality   ││
                    │  └─────────────────────┘│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Security Scanning     │
                    │  ┌─────────────────────┐│
                    │  │ Dependency Scan     ││
                    │  │ Container Scan      ││
                    │  │ SAST Analysis       ││
                    │  └─────────────────────┘│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Build Images       │
                    │  ┌─────────────────────┐│
                    │  │ Docker Build        ││
                    │  │ Integration Test    ││
                    │  │ Image Optimization  ││
                    │  └─────────────────────┘│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Deployment         │
                    │  ┌─────────────────────┐│
                    │  │ Staging (develop)   ││
                    │  │ Production (main)   ││
                    │  │ Health Checks       ││
                    │  └─────────────────────┘│
                    └─────────────────────────┘
```

## Workflow Files

### Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

The primary workflow that handles:
- **Testing**: All components with coverage reporting
- **Security**: Vulnerability scanning and code analysis
- **Building**: Docker images with optimization
- **Deployment**: Automated deployment to staging and production

### Existing Workflows

1. **Build Workflow** (`.github/workflows/build.yml`)
   - Docker multi-platform builds
   - Integration with Docker Hub

2. **CodeQL Analysis** (`.github/workflows/codeql.yml`)
   - Advanced security analysis
   - Vulnerability detection

3. **Deploy Workflow** (`.github/workflows/deploy.yml`)
   - Basic deployment automation

## Pipeline Stages

### 1. Testing Stage

#### Frontend Testing
- **Framework**: Jest with React Testing Library
- **Coverage**: LCOV reports uploaded to Codecov
- **Type Checking**: TypeScript validation
- **Location**: `apps/frontend`

```bash
# Run locally
cd apps/frontend
npm test -- --coverage
npm run type-check
```

#### Backend Testing
- **Framework**: Jest with Node.js
- **Services**: PostgreSQL and Redis test databases
- **Coverage**: LCOV reports uploaded to Codecov
- **Location**: `apps/backend`

```bash
# Run locally
cd apps/backend
npm test -- --coverage
```

#### AI Service Testing
- **Framework**: pytest with coverage
- **Package Manager**: Poetry
- **Coverage**: XML reports uploaded to Codecov
- **Location**: `apps/ai-service`

```bash
# Run locally
cd apps/ai-service
poetry run pytest --cov=ai_service --cov-report=xml
```

### 2. Security Scanning Stage

#### Dependency Scanning
- **Tool**: Snyk for Node.js dependencies
- **Tool**: Safety for Python dependencies
- **Tool**: npm audit for additional Node.js scanning
- **Output**: SARIF files uploaded to GitHub Security tab

#### Container Scanning
- **Tool**: Trivy for container vulnerability scanning
- **Scope**: All Docker images (frontend, backend, AI service)
- **Output**: SARIF files uploaded to GitHub Security tab

#### Static Analysis
- **Tool**: CodeQL (existing workflow)
- **Tool**: ESLint for JavaScript/TypeScript
- **Tool**: Python linting (flake8, black, isort)

### 3. Build Stage

#### Docker Image Building
- **Platform**: Multi-platform (linux/amd64, linux/arm64)
- **Optimization**: Layer caching with GitHub Actions cache
- **Testing**: Docker Compose integration testing
- **Registry**: Docker Hub for production images

#### Build Artifacts
- **Frontend**: Optimized React build
- **Backend**: Node.js application with dependencies
- **AI Service**: Python application with Poetry dependencies

### 4. Deployment Stage

#### Staging Deployment
- **Trigger**: Push to `develop` branch
- **Environment**: GitHub Environment protection
- **Process**: Automated deployment with health checks
- **Testing**: Performance testing post-deployment

#### Production Deployment
- **Trigger**: Push to `main` branch
- **Environment**: GitHub Environment protection with approvals
- **Process**: Blue-green deployment with rollback capability
- **Monitoring**: Comprehensive health checks and monitoring

## Environment Configuration

### Required Secrets

Configure these secrets in your GitHub repository settings:

```bash
# Docker Hub credentials
DOCKER_PAT=your_docker_hub_personal_access_token

# Security scanning
SNYK_TOKEN=your_snyk_api_token

# Deployment credentials (if using SSH deployment)
DEPLOY_SSH_KEY=your_private_ssh_key
DEPLOY_HOST=your_deployment_server
DEPLOY_USER=your_deployment_user

# Database credentials for production
PROD_DB_PASSWORD=your_production_database_password

# API keys for production
PROD_OPENAI_API_KEY=your_production_openai_key
```

### Required Variables

Configure these variables in your GitHub repository settings:

```bash
# Docker Hub username
DOCKER_USER=your_docker_hub_username

# Deployment configuration
STAGING_URL=https://staging.yourdomain.com
PRODUCTION_URL=https://yourdomain.com
```

### Environment Protection Rules

#### Staging Environment
- **Required reviewers**: 0 (automatic deployment)
- **Wait timer**: 0 minutes
- **Deployment branches**: `develop` only

#### Production Environment
- **Required reviewers**: 1+ (manual approval required)
- **Wait timer**: 5 minutes
- **Deployment branches**: `main` only

## Local Development

### Running Tests Locally

```bash
# Install all dependencies
npm run install:all

# Run all tests
npm test

# Run specific component tests
cd apps/frontend && npm test
cd apps/backend && npm test
cd apps/ai-service && poetry run pytest

# Run with coverage
npm test -- --coverage
```

### Running Security Scans Locally

```bash
# Install security tools
npm install -g snyk
pip install safety

# Run dependency scans
snyk test
safety check

# Run container scans (requires Docker)
docker run --rm -v $(pwd):/workspace aquasec/trivy fs /workspace
```

### Running Linting Locally

```bash
# JavaScript/TypeScript linting
npx eslint . --ext .js,.jsx,.ts,.tsx

# Python linting
cd apps/ai-service
poetry run flake8 .
poetry run black --check .
poetry run isort --check-only .
```

## Monitoring and Observability

### Test Coverage

- **Target**: 80% minimum coverage for all components
- **Reporting**: Codecov integration with PR comments
- **Trends**: Coverage trends tracked over time

### Security Metrics

- **Vulnerability Tracking**: GitHub Security tab
- **Dependency Updates**: Automated PR creation for security updates
- **Compliance**: Regular security audit reports

### Performance Metrics

- **Build Times**: Tracked and optimized
- **Deployment Times**: Monitored for regression
- **Test Execution**: Performance trends analysis

## Troubleshooting

### Common Issues

#### Test Failures

```bash
# Frontend test issues
cd apps/frontend
npm ci  # Clean install
npm test -- --verbose

# Backend test issues
cd apps/backend
npm ci
# Ensure test database is running
docker run -d --name test-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
npm test

# AI service test issues
cd apps/ai-service
poetry install
poetry run pytest -v
```

#### Build Failures

```bash
# Docker build issues
docker build -f apps/frontend/Dockerfile -t test-frontend .
docker build -f apps/backend/Dockerfile -t test-backend .
docker build -f apps/ai-service/Dockerfile -t test-ai-service .

# Check Docker Compose
cd docker
docker-compose config
docker-compose up --build
```

#### Deployment Issues

```bash
# Check deployment logs
# In GitHub Actions, review the deployment job logs

# Test deployment locally
cd docker
docker-compose up -d
# Wait for services to start
sleep 30
# Check health endpoints
curl http://localhost:8000/health
curl http://localhost:8001/health
```

### Debug Mode

Enable debug logging in GitHub Actions by setting the secret:
```bash
ACTIONS_STEP_DEBUG=true
```

## Best Practices

### Code Quality

1. **Write Tests First**: Follow TDD principles
2. **Maintain Coverage**: Keep test coverage above 80%
3. **Code Reviews**: All changes require PR review
4. **Linting**: Fix all linting errors before merging

### Security

1. **Dependency Updates**: Regular security updates
2. **Secret Management**: Use GitHub Secrets for sensitive data
3. **Least Privilege**: Minimal permissions for deployment
4. **Audit Logs**: Monitor all deployment activities

### Performance

1. **Optimize Builds**: Use layer caching and multi-stage builds
2. **Parallel Execution**: Run tests in parallel where possible
3. **Resource Limits**: Set appropriate resource limits
4. **Monitoring**: Track build and deployment performance

### Deployment

1. **Blue-Green Deployment**: Zero-downtime deployments
2. **Health Checks**: Comprehensive health validation
3. **Rollback Strategy**: Quick rollback capability
4. **Environment Parity**: Keep environments consistent

## Extending the Pipeline

### Adding New Tests

1. **Frontend**: Add test files in `apps/frontend/src/__tests__/`
2. **Backend**: Add test files in `apps/backend/__tests__/`
3. **AI Service**: Add test files in `apps/ai-service/tests/`

### Adding New Security Scans

```yaml
# Example: Adding OWASP ZAP security scan
- name: OWASP ZAP Scan
  uses: zaproxy/action-full-scan@v0.4.0
  with:
    target: 'https://staging.yourdomain.com'
```

### Adding New Deployment Targets

```yaml
# Example: Adding AWS ECS deployment
- name: Deploy to AWS ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: task-definition.json
    service: my-service
    cluster: my-cluster
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Monthly security updates
2. **Review Metrics**: Weekly performance review
3. **Clean Artifacts**: Regular cleanup of old artifacts
4. **Update Documentation**: Keep this guide current

### Monitoring

1. **Pipeline Health**: Monitor success rates
2. **Performance Trends**: Track build and test times
3. **Security Alerts**: Respond to vulnerability notifications
4. **Resource Usage**: Monitor GitHub Actions usage

## Support

For issues with the CI/CD pipeline:

1. **Check Logs**: Review GitHub Actions logs
2. **Local Testing**: Reproduce issues locally
3. **Documentation**: Refer to this guide and GitHub Actions docs
4. **Team Support**: Reach out to the development team

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: DeckChatbot Development Team
