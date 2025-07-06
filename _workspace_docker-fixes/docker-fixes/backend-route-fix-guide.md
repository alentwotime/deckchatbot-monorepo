# Backend Route Fix Guide
# Addresses the path-to-regexp "Missing parameter name" error

## Problem Location
The error occurs in the backend service:
```
TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError
    at name (/app/node_modules/path-to-regexp/dist/index.js:73:19)
```

## Common Causes & Fixes

### 1. Malformed Route Parameters
**BAD Examples (cause errors):**
```javascript
// Missing parameter name
app.get('/api/:/', handler)
app.get('/users/:', handler)
app.get('/api/:?', handler)

// Empty parameter
app.get('/api/:', handler)
```

**GOOD Examples (fixed):**
```javascript
// Proper parameter naming
app.get('/api/:id', handler)
app.get('/users/:userId', handler)
app.get('/api/:resourceId?', handler) // Optional parameter
```

### 2. Check These Files for Route Issues:
- `server.js` - Main server routes
- `routes.js` - Route definitions
- `visionRouter.js` - Vision-related routes
- Any files in `api/` directory

### 3. Search Commands to Find Issues:
```bash
# Search for problematic route patterns
grep -r "app\.\(get\|post\|put\|delete\).*:/" .
grep -r "router\.\(get\|post\|put\|delete\).*:/" .
grep -r ":\s*[,/)]" . --include="*.js"
```

### 4. Common Route Patterns to Fix:

**Pattern 1: Empty parameter**
```javascript
// BAD
app.get('/api/:/', (req, res) => {})

// GOOD
app.get('/api/:id', (req, res) => {})
```

**Pattern 2: Missing parameter name**
```javascript
// BAD
app.get('/users/:', (req, res) => {})

// GOOD
app.get('/users/:userId', (req, res) => {})
```

**Pattern 3: Malformed optional parameters**
```javascript
// BAD
app.get('/api/:?', (req, res) => {})

// GOOD
app.get('/api/:id?', (req, res) => {})
```

### 5. Specific Files to Check:

**In server.js, look for:**
```javascript
// Check all app.use(), app.get(), app.post(), etc.
// Make sure all :parameters have names
```

**In routes.js, look for:**
```javascript
// Check all router definitions
// Ensure proper parameter syntax
```

**In visionRouter.js, look for:**
```javascript
// Check vision-related routes
// Fix any malformed parameters
```

## Quick Fix Script:
```bash
# Run this in the backend directory to find potential issues:
find . -name "*.js" -exec grep -l ":\s*[,/)]" {} \;
```

## Testing the Fix:
1. Fix the route definitions
2. Restart the backend service
3. Check logs for the path-to-regexp error
4. Verify routes work correctly