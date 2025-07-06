# Complete Docker Compose Fix Instructions

## EXECUTE THESE STEPS IN ORDER:

### Step 1: Fix Backend Rate Limiting Issue
```bash
# Navigate to backend directory
cd ../backend

# Edit middleware/rateLimiting.js
# Find the line with delayMs: 500 (around line 55)
# Replace with: delayMs: () => 500
# Add: validate: { delayMs: false }
```

**Exact change needed in `middleware/rateLimiting.js`:**
```javascript
// REPLACE THIS:
delayMs: 500

// WITH THIS:
delayMs: () => 500,
validate: { delayMs: false }
```

### Step 2: Fix Backend Route Parameter Error
```bash
# Search for malformed routes in backend directory
cd ../backend
grep -r ":\s*[,/)]" . --include="*.js"

# Common files to check:
# - server.js
# - routes.js  
# - visionRouter.js
# - api/ directory files

# Look for patterns like:
# app.get('/api/:/', handler)  <- BAD
# app.get('/api/:id', handler) <- GOOD
```

### Step 3: Fix Frontend Nginx Configuration
```bash
# Navigate to frontend directory
cd ../frontend

# Replace nginx.conf with the fixed version
# Key changes:
# - pid /tmp/nginx.pid;
# - upstream backend { server backend:3000; }
# - Add temp directories nginx can write to
```

### Step 4: Update Frontend Dockerfile
```bash
# In frontend directory, update Dockerfile:
# - Add proper user permissions
# - Create writable directories
# - Add health check
```

### Step 5: Update Docker Compose Configuration
```bash
# Navigate to docker directory
cd ../docker

# Replace docker-compose.yml with fixed version:
# - Add health checks for all services
# - Add proper depends_on conditions
# - Add restart policies
# - Add network configuration
```

### Step 6: Test the Fixes
```bash
# Stop any running containers
docker-compose down

# Remove old containers and images
docker-compose rm -f
docker system prune -f

# Build and start services
docker-compose up --build -d

# Check service status
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs ai-service
```

### Step 7: Verify Everything Works
```bash
# Test backend health
curl http://localhost:3000/health

# Test frontend
curl http://localhost/health

# Test ai-service
curl http://localhost:8000/health

# Check all containers are healthy
docker-compose ps
```

## TROUBLESHOOTING:

### If Backend Still Crashes:
1. Check for remaining route parameter issues
2. Look at backend logs: `docker-compose logs backend`
3. Search for any remaining `:` without parameter names

### If Frontend Can't Connect to Backend:
1. Verify backend service is healthy
2. Check nginx upstream configuration
3. Ensure service names match in docker-compose.yml

### If Permission Issues Persist:
1. Check Dockerfile user configuration
2. Verify directory permissions
3. Try running with `--privileged` flag temporarily

## SUCCESS INDICATORS:
- ✅ All containers show "healthy" status
- ✅ No error messages in logs
- ✅ Backend responds to health checks
- ✅ Frontend serves content
- ✅ AI service is accessible

## FINAL VALIDATION COMMANDS:
```bash
# All services should be healthy
docker-compose ps

# No errors in logs
docker-compose logs --tail=50

# Services respond to requests
curl http://localhost/
curl http://localhost:3000/health
curl http://localhost:8000/health
```