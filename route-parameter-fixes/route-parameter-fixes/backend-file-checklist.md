# Backend File Checklist - Route Parameter Issues

## 📋 **Files to Check (Priority Order)**

### **🚨 CRITICAL PRIORITY**

#### **1. visionRouter.js** 
- **Risk Level:** ⚠️ **VERY HIGH**
- **Why:** Specialized router with complex vision-related routes
- **Check for:**
  ```javascript
  // Likely problematic patterns:
  router.post('/vision/:/', handler)
  router.get('/analyze/:', handler)
  router.put('/process/:/', handler)
  ```
- **Search command:** `grep -n ":" visionRouter.js`

#### **2. server.js**
- **Risk Level:** ⚠️ **HIGH** 
- **Why:** Main server file with primary route definitions
- **Check for:**
  ```javascript
  // Likely problematic patterns:
  app.get('/api/:/', handler)
  app.use('/routes/:/', middleware)
  app.post('/upload/:/', handler)
  ```
- **Search command:** `grep -n "app\." server.js | grep ":"`

#### **3. routes.js**
- **Risk Level:** ⚠️ **HIGH**
- **Why:** Dedicated route definitions file
- **Check for:**
  ```javascript
  // Likely problematic patterns:
  router.get('/data/:/', handler)
  router.post('/items/:', handler)
  router.put('/users/:/', handler)
  ```
- **Search command:** `grep -n "router\." routes.js | grep ":"`

### **🔍 MEDIUM PRIORITY**

#### **4. api/ Directory Files**
- **Risk Level:** ⚠️ **MEDIUM**
- **Files to check:**
  - `api/index.js`
  - `api/routes.js` 
  - Any other `.js` files in `api/`
- **Search command:** `find api/ -name "*.js" -exec grep -l ":" {} \;`

#### **5. middleware/ Directory**
- **Risk Level:** ⚠️ **LOW-MEDIUM**
- **Why:** May contain route-related middleware
- **Check:** Any files that define routes or use Express router
- **Search command:** `find middleware/ -name "*.js" -exec grep -l "app\|router" {} \;`

### **🔎 LOW PRIORITY**

#### **6. services/ Directory**
- **Risk Level:** ⚠️ **LOW**
- **Why:** Usually business logic, but may have route definitions
- **Check:** Files that might define routes

#### **7. utils/ Directory**
- **Risk Level:** ⚠️ **VERY LOW**
- **Why:** Utility functions, unlikely to have routes

## 🔍 **Systematic Search Process**

### **Step 1: Quick Scan All Files**
```bash
# Find all files with route patterns
grep -r "app\.\|router\." . --include="*.js" | grep ":"

# Find files with colon parameters
grep -r ":[,/)]" . --include="*.js"

# Find potential malformed patterns
grep -r ":\s*[,/)]" . --include="*.js"
```

### **Step 2: Check High-Priority Files**
```bash
# Check visionRouter.js specifically
echo "=== CHECKING visionRouter.js ==="
grep -n ":" visionRouter.js | grep -E "(get|post|put|delete|patch)"

# Check server.js specifically  
echo "=== CHECKING server.js ==="
grep -n ":" server.js | grep -E "(app\.|router\.)"

# Check routes.js specifically
echo "=== CHECKING routes.js ==="
grep -n ":" routes.js | grep -E "(get|post|put|delete|patch)"
```

### **Step 3: Manual File Review**

#### **For each file, look for these patterns:**

##### **❌ CRASH-CAUSING PATTERNS:**
```javascript
// Missing parameter name
app.get('/path/:/', handler)
router.post('/api/:/', handler)

// Empty parameter  
app.put('/data/:', handler)
router.delete('/items/:', handler)

// Malformed optional
app.get('/search/:?', handler)
router.get('/filter/:?/', handler)
```

##### **✅ CORRECT PATTERNS:**
```javascript
// Named parameters
app.get('/path/:id', handler)
router.post('/api/:resourceId', handler)

// Proper parameters
app.put('/data/:dataId', handler)  
router.delete('/items/:itemId', handler)

// Correct optional
app.get('/search/:query?', handler)
router.get('/filter/:filterId?', handler)
```

## 📊 **File-by-File Checklist**

### **visionRouter.js**
- [ ] Check all `router.get()` calls
- [ ] Check all `router.post()` calls  
- [ ] Check all `router.put()` calls
- [ ] Check all `router.delete()` calls
- [ ] Look for vision-specific routes like `/analyze/:`, `/process/:`

### **server.js**
- [ ] Check all `app.get()` calls
- [ ] Check all `app.post()` calls
- [ ] Check all `app.use()` calls with parameters
- [ ] Check middleware route definitions
- [ ] Look for API routes like `/api/:`

### **routes.js**
- [ ] Check all router method calls
- [ ] Check exported route definitions
- [ ] Look for RESTful patterns that might be malformed
- [ ] Check nested route structures

### **api/ files**
- [ ] Check each `.js` file in the directory
- [ ] Look for API endpoint definitions
- [ ] Check for route parameter patterns

## 🎯 **Quick Elimination Method**

If systematic search is taking too long:

### **Method 1: File Isolation**
```bash
# 1. Backup and remove visionRouter.js
mv visionRouter.js visionRouter.js.backup
# 2. Test backend startup
docker-compose up backend
# 3. If it starts, the problem was in visionRouter.js
# 4. Restore and fix that file
```

### **Method 2: Comment Out Routes**
```javascript
// In each file, temporarily comment out route definitions:
/*
app.get('/suspected/route/:/', handler);
*/

// Test startup after each comment
// When backend starts, you found the problematic route
```

## ✅ **Verification Steps**

After fixing any route:

1. **Save the file**
2. **Restart backend:** `docker-compose restart backend`
3. **Check logs:** `docker-compose logs backend`
4. **Look for:** No path-to-regexp errors
5. **Verify:** Backend shows healthy status

**Remember: Just ONE malformed route will crash the entire backend!**