# DeckChatbot Project Structure

This document describes the standardized project structure for the DeckChatbot monorepo. The structure has been
organized to follow consistent naming conventions and eliminate redundancies.

## Directory Structure

```
deckchatbot-monorepo/
├── apps/                           # Application services (microservices architecture)
│   ├── ai-service/                 # Consolidated AI service
│   │   ├── ai_service/            # Python package for AI functionality
│   │   │   ├── core.py            # Core AI functionality (Ollama integration)
│   │   │   ├── image_processing.py # Image processing and OCR
│   │   │   ├── blueprint.py       # Blueprint generation
│   │   │   └── main.py            # FastAPI application
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh
│   │   └── README.md
│   ├── backend/                    # Main backend service
│   │   ├── backend-ai/            # Backend AI proxy service
│   │   ├── image-proxy/           # Image analysis proxy service
│   │   ├── api/                   # API routes and handlers
│   │   ├── controllers/           # Business logic controllers
│   │   ├── routes/                # Route definitions
│   │   ├── utils/                 # Backend utilities
│   │   └── server.js              # Main server file
│   └── frontend/                   # Frontend application
│       ├── src/                   # Source code
│       ├── public/                # Static assets
│       ├── config/                # Configuration files
│       ├── controllers/           # Frontend controllers
│       ├── routes/                # Frontend routes
│       ├── services/              # Frontend services
│       ├── middleware/            # Middleware functions
│       ├── previous-html/         # Legacy HTML files
│       ├── scripts/               # Build and utility scripts
│       ├── .babelrc              # Babel configuration
│       ├── .gitignore            # Git ignore rules
│       ├── .dockerignore         # Docker ignore rules
│       ├── .npmrc                # NPM configuration
│       └── package.json          # Dependencies and scripts
├── shared/                         # Shared libraries and utilities
│   ├── libs/                      # Shared libraries
│   ├── utils/                     # Shared utilities
│   └── deckchatbot_schema.sql     # Database schema
├── docker/                        # Docker configurations
│   └── docker-compose.yml        # Multi-service orchestration
├── docs/                          # Documentation
│   ├── tasks.md                   # Improvement tasks checklist
│   ├── project-structure.md       # This document
│   └── *.md                       # Other documentation files
├── scripts/                       # Build and deployment scripts
├── tests/                         # Test files
├── _archived_unused_code/         # Archived legacy code
└── [config files]                # Root-level configuration files
```

## Naming Conventions

### Directories

- **kebab-case**: Use lowercase letters with hyphens for directory names (e.g., `ai-service`, `image-proxy`)
- **No spaces**: Directory names should never contain spaces
- **Descriptive names**: Use clear, descriptive names that indicate the purpose (avoid generic names like `app2`)

### Files

- **kebab-case**: For configuration files and scripts (e.g., `docker-compose.yml`)
- **snake_case**: For Python files and modules (e.g., `image_processing.py`)
- **camelCase**: For JavaScript/TypeScript files when appropriate
- **lowercase**: For standard files (e.g., `dockerfile`, `readme.md`)

## Architectural Principles

### 1. Microservices Organization

- Each service in `apps/` is a self-contained microservice
- Services communicate via well-defined APIs
- Each service has its own dependencies and configuration

### 2. Feature-Based Organization

- Within services, organize code by feature rather than by type
- Group related functionality together
- Separate concerns clearly (e.g., AI core vs image processing)

### 3. Shared Resources

- Common utilities and libraries go in `shared/`
- Avoid duplication across services
- Use shared libraries for common functionality

### 4. Configuration Management

- Service-specific configuration stays with the service
- Global configuration at the root level
- Environment-specific configuration in appropriate locations

## Changes Made During Standardization

### Removed Redundancies

1. **Removed `apps/frontend/frontend/`** - Eliminated nested redundancy
    - Moved configuration files to parent directory
2. **Removed `apps/backend/ai_service/`** - Empty directory
3. **Removed `apps/backend/backend-ai/`** - Redundant with consolidated AI service
4. **Removed `backend/backend-ai/`** - Redundant with apps structure
5. **Removed entire `backend/` directory** - All backend functionality moved to `apps/backend/`

### Renamed for Consistency

1. **`apps/backend/backend_ai/` → `apps/backend/backend-ai/`** - Standardized to kebab-case
2. **`apps/frontend/previous html/` → `apps/frontend/previous-html/`** - Removed spaces
3. **`apps/backend/app2/` → `apps/backend/image-proxy/`** - Descriptive naming
4. **Eliminated nested `app2/app2/` structure** - Moved files to parent directory

### Configuration Consolidation

- Moved `.babelrc`, `.gitignore`, `.dockerignore`, `.npmrc` from nested directories to appropriate parent directories
- Ensured no configuration conflicts or duplications

## Guidelines for Future Development

### Adding New Services

1. Create new services under `apps/` directory
2. Use kebab-case naming
3. Include proper documentation (README.md)
4. Follow the established directory structure pattern

### Adding New Features

1. Organize by feature, not by file type
2. Use appropriate shared libraries when possible
3. Follow established naming conventions
4. Update documentation as needed

### Refactoring Existing Code

1. Maintain the established directory structure
2. Follow naming conventions consistently
3. Eliminate redundancies when found
4. Update references and documentation

## Benefits of This Structure

1. **Consistency**: Clear naming conventions across the entire project
2. **Maintainability**: Logical organization makes code easier to find and modify
3. **Scalability**: Microservices architecture supports independent scaling
4. **Clarity**: Descriptive names and organization reduce confusion
5. **Efficiency**: Eliminated redundancies reduce maintenance overhead

This structure provides a solid foundation for continued development and makes the codebase more accessible to new
developers joining the project.
