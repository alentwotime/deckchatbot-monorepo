# Docker Compose Fix Plan - Step by Step

## CRITICAL ERRORS IDENTIFIED:

### Backend Service Errors:
1. **Express-slow-down delayMs deprecation warning**
2. **Path-to-regexp TypeError: Missing parameter name**
3. **Service crash loop**

### Frontend Service Errors:
1. **Nginx permission denied for /run/nginx.pid**
2. **Backend upstream host not found**
3. **Dependency failure causing restart loop**

## STEP-BY-STEP FIX INSTRUCTIONS:

### Step 1: Fix Backend Express-slow-down Configuration
**File:** `middleware/rateLimiting.js` (line ~55)

**Problem:** Deprecated delayMs configuration
**Fix:** Update the delayMs option to use new syntax

```javascript
// OLD (causing warning):
delayMs: 500

// NEW (fix):
delayMs: () => 500
```

### Step 2: Fix Backend Path-to-regexp Error
**Problem:** Missing parameter name in route definition
**Location:** Likely in routes.js or server.js where path-to-regexp is used

**Fix:** Find and fix malformed route patterns like:
```javascript
// BAD - causes "Missing parameter name" error:
app.get('/api/:/', handler)

// GOOD - proper parameter naming:
app.get('/api/:id', handler)
```

### Step 3: Fix Frontend Nginx Permission Issues
**File:** Frontend Dockerfile or nginx configuration

**Problem:** Nginx can't write to /run/nginx.pid due to permissions
**Fix:** Add proper user permissions or use alternative PID location

```dockerfile
# Add to frontend Dockerfile:
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run/nginx
```

### Step 4: Fix Frontend Nginx Backend Upstream
**File:** nginx configuration (likely in frontend container)

**Problem:** "host not found in upstream 'backend'"
**Fix:** Ensure backend service name matches docker-compose service name

```nginx
# In nginx.conf, ensure upstream matches service name:
upstream backend {
    server backend:3000;  # Must match docker-compose service name
}
```

### Step 5: Fix Docker Compose Dependencies
**File:** docker-compose.yml

**Problem:** Frontend trying to start before backend is ready
**Fix:** Add proper depends_on and health checks

```yaml
services:
  frontend:
    depends_on:
      backend:
        condition: service_healthy
  
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## EXECUTION ORDER:
1. Fix backend code issues first (Steps 1-2)
2. Fix frontend configuration (Steps 3-4)  
3. Update docker-compose.yml (Step 5)
4. Test complete stack

## VALIDATION COMMANDS:
```bash
# Test backend alone:
docker-compose up backend

# Test frontend alone:
docker-compose up frontend

# Test complete stack:
docker-compose up -d

# Check logs:
docker-compose logs backend
docker-compose logs frontend
```