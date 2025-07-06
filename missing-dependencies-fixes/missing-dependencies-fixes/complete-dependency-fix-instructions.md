# Complete Missing Dependencies Fix Instructions

## 🚨 **CRITICAL: Backend Dependency Fix**

Your backend is crashing due to missing npm packages. Follow these steps **EXACTLY** to fix it.

## **Step 1: Identify Missing Dependencies**

### **Current Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'axios' imported from /app/visionRouter.js
```

### **What This Means:**
- `visionRouter.js` is trying to import `axios` package
- `axios` is not listed in `package.json` dependencies
- The package was not installed during Docker build
- Backend crashes on startup

## **Step 2: Check Current package.json**

### **Navigate to backend directory:**
```bash
cd apps/backend
```

### **Check current dependencies:**
```bash
cat package.json
```

### **Look for missing packages:**
- `axios` - HTTP client library
- Possibly other packages used in your code

## **Step 3: Add Missing Dependencies**

### **Method 1: Add axios to package.json**
Edit `apps/backend/package.json` and add to dependencies:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    // ... other existing dependencies
  }
}
```

### **Method 2: Use npm install (if not using Docker)**
```bash
cd apps/backend
npm install axios
```

## **Step 4: Scan for Other Missing Dependencies**

### **Search for import statements:**
```bash
# In backend directory, search for all imports
grep -r "import.*from" . --include="*.js" | grep -v node_modules
grep -r "require(" . --include="*.js" | grep -v node_modules
```

### **Common packages that might be missing:**
- `axios` - HTTP requests
- `multer` - File uploads
- `cors` - Cross-origin requests
- `helmet` - Security headers
- `morgan` - Logging
- `dotenv` - Environment variables
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens

## **Step 5: Update package.json with All Missing Dependencies**

### **Complete dependencies section should include:**
```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.6.0",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.0.0",
    "express-rate-limit": "^6.0.0",
    "express-slow-down": "^1.6.0"
  }
}
```

## **Step 6: Rebuild Docker Container**

### **Stop current containers:**
```bash
cd docker
docker-compose down
```

### **Remove old images:**
```bash
docker-compose rm -f
docker system prune -f
```

### **Rebuild with new dependencies:**
```bash
docker-compose build backend
```

### **Start services:**
```bash
docker-compose up -d
```

## **Step 7: Test the Fix**

### **Check backend logs:**
```bash
docker-compose logs backend
```

### **Look for success indicators:**
- ✅ No "Cannot find package" errors
- ✅ Backend starts without crashing
- ✅ Server listening on port message
- ✅ Container shows healthy status

### **Test backend health:**
```bash
curl http://localhost:3000/health
```

## **Step 8: Verify All Services**

### **Check container status:**
```bash
docker-compose ps
```

### **All containers should show:**
- ✅ backend: healthy
- ✅ frontend: healthy  
- ✅ ai-service: healthy

## **🔍 Quick Dependency Scanner**

### **Find all require/import statements:**
```bash
# In backend directory
find . -name "*.js" -not -path "./node_modules/*" -exec grep -l "require\|import.*from" {} \; | xargs grep -h "require\|import.*from" | sort | uniq
```

## **🚨 Emergency Quick Fix**

If you can't identify all missing packages:

### **Method 1: Copy from working package.json**
Use the `updated-package.json` file provided in this fix package.

### **Method 2: Install common packages**
```bash
cd apps/backend
npm install axios multer cors helmet morgan dotenv bcrypt jsonwebtoken express-rate-limit express-slow-down
```

### **Method 3: Check visionRouter.js specifically**
```bash
grep -n "import\|require" apps/backend/visionRouter.js
```

## **⚠️ IMPORTANT:**
- **Every missing package** will crash the backend
- **Rebuild Docker container** after changing package.json
- **Test thoroughly** after each fix
- **Don't skip the rebuild step**

**This fix is CRITICAL - your backend will not start until all dependencies are installed!**