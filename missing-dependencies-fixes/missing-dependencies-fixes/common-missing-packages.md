# Common Missing Packages Reference

## 📦 **Most Commonly Missing npm Packages**

### **🚨 Critical Packages (Usually Missing)**

#### **1. axios**
- **Purpose:** HTTP client for making API requests
- **Usage:** `import axios from 'axios'`
- **Common in:** API calls, external service integration
- **Version:** `^1.6.0`
- **Install:** `npm install axios`

#### **2. multer**
- **Purpose:** File upload middleware for Express
- **Usage:** `import multer from 'multer'`
- **Common in:** File upload endpoints, image processing
- **Version:** `^1.4.5`
- **Install:** `npm install multer`

#### **3. cors**
- **Purpose:** Cross-Origin Resource Sharing middleware
- **Usage:** `import cors from 'cors'`
- **Common in:** Frontend-backend communication
- **Version:** `^2.8.5`
- **Install:** `npm install cors`

#### **4. helmet**
- **Purpose:** Security middleware for Express
- **Usage:** `import helmet from 'helmet'`
- **Common in:** Security headers, protection
- **Version:** `^7.0.0`
- **Install:** `npm install helmet`

#### **5. morgan**
- **Purpose:** HTTP request logger middleware
- **Usage:** `import morgan from 'morgan'`
- **Common in:** Request logging, debugging
- **Version:** `^1.10.0`
- **Install:** `npm install morgan`

#### **6. dotenv**
- **Purpose:** Environment variable loader
- **Usage:** `import dotenv from 'dotenv'`
- **Common in:** Configuration management
- **Version:** `^16.3.1`
- **Install:** `npm install dotenv`

### **🔐 Authentication & Security Packages**

#### **7. bcrypt**
- **Purpose:** Password hashing library
- **Usage:** `import bcrypt from 'bcrypt'`
- **Common in:** User authentication, password security
- **Version:** `^5.1.1`
- **Install:** `npm install bcrypt`

#### **8. jsonwebtoken**
- **Purpose:** JWT token creation and verification
- **Usage:** `import jwt from 'jsonwebtoken'`
- **Common in:** Authentication, session management
- **Version:** `^9.0.2`
- **Install:** `npm install jsonwebtoken`

### **⚡ Rate Limiting & Performance**

#### **9. express-rate-limit**
- **Purpose:** Rate limiting middleware
- **Usage:** `import rateLimit from 'express-rate-limit'`
- **Common in:** API protection, DDoS prevention
- **Version:** `^6.10.0`
- **Install:** `npm install express-rate-limit`

#### **10. express-slow-down**
- **Purpose:** Request slow-down middleware
- **Usage:** `import slowDown from 'express-slow-down'`
- **Common in:** Rate limiting, performance control
- **Version:** `^1.6.0`
- **Install:** `npm install express-slow-down`

### **🔧 Utility Packages**

#### **11. body-parser**
- **Purpose:** Request body parsing middleware
- **Usage:** `import bodyParser from 'body-parser'`
- **Common in:** POST request handling, JSON parsing
- **Version:** `^1.20.2`
- **Install:** `npm install body-parser`

#### **12. cookie-parser**
- **Purpose:** Cookie parsing middleware
- **Usage:** `import cookieParser from 'cookie-parser'`
- **Common in:** Session management, authentication
- **Version:** `^1.4.6`
- **Install:** `npm install cookie-parser`

#### **13. uuid**
- **Purpose:** UUID generation
- **Usage:** `import { v4 as uuidv4 } from 'uuid'`
- **Common in:** Unique ID generation, database keys
- **Version:** `^9.0.1`
- **Install:** `npm install uuid`

#### **14. validator**
- **Purpose:** String validation and sanitization
- **Usage:** `import validator from 'validator'`
- **Common in:** Input validation, data sanitization
- **Version:** `^13.11.0`
- **Install:** `npm install validator`

### **🖼️ Image & File Processing**

#### **15. sharp**
- **Purpose:** High-performance image processing
- **Usage:** `import sharp from 'sharp'`
- **Common in:** Image resizing, format conversion
- **Version:** `^0.32.6`
- **Install:** `npm install sharp`

#### **16. jimp**
- **Purpose:** JavaScript image manipulation
- **Usage:** `import Jimp from 'jimp'`
- **Common in:** Image editing, filters
- **Version:** `^0.22.10`
- **Install:** `npm install jimp`

### **📊 Database Packages**

#### **17. mongoose**
- **Purpose:** MongoDB object modeling
- **Usage:** `import mongoose from 'mongoose'`
- **Common in:** MongoDB database operations
- **Version:** `^7.6.3`
- **Install:** `npm install mongoose`

#### **18. mysql2**
- **Purpose:** MySQL database driver
- **Usage:** `import mysql from 'mysql2'`
- **Common in:** MySQL database operations
- **Version:** `^3.6.3`
- **Install:** `npm install mysql2`

#### **19. pg**
- **Purpose:** PostgreSQL database driver
- **Usage:** `import { Pool } from 'pg'`
- **Common in:** PostgreSQL database operations
- **Version:** `^8.11.3`
- **Install:** `npm install pg`

### **🌐 Communication & External Services**

#### **20. socket.io**
- **Purpose:** Real-time bidirectional communication
- **Usage:** `import { Server } from 'socket.io'`
- **Common in:** Chat applications, real-time updates
- **Version:** `^4.7.4`
- **Install:** `npm install socket.io`

#### **21. nodemailer**
- **Purpose:** Email sending
- **Usage:** `import nodemailer from 'nodemailer'`
- **Common in:** Email notifications, contact forms
- **Version:** `^6.9.7`
- **Install:** `npm install nodemailer`

#### **22. redis**
- **Purpose:** Redis client for caching
- **Usage:** `import redis from 'redis'`
- **Common in:** Caching, session storage
- **Version:** `^4.6.10`
- **Install:** `npm install redis`

## 🔍 **How to Identify Missing Packages**

### **Search Commands:**
```bash
# Find all import statements
grep -r "import.*from" . --include="*.js" | grep -v node_modules

# Find all require statements  
grep -r "require(" . --include="*.js" | grep -v node_modules

# Check specific file
grep -n "import\|require" visionRouter.js
```

### **Common Import Patterns:**
```javascript
// ES6 imports
import axios from 'axios';
import { multer } from 'multer';
import cors from 'cors';

// CommonJS requires
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');
```

## 📋 **Quick Fix Package.json Template**

### **Minimal Dependencies (Most Common):**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5"
  }
}
```

### **Complete Dependencies (All Common Packages):**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express-rate-limit": "^6.10.0",
    "express-slow-down": "^1.6.0",
    "body-parser": "^1.20.2",
    "cookie-parser": "^1.4.6",
    "uuid": "^9.0.1",
    "validator": "^13.11.0"
  }
}
```

## ⚡ **Quick Install Commands**

### **Install Critical Packages:**
```bash
npm install axios multer cors helmet morgan dotenv
```

### **Install All Common Packages:**
```bash
npm install axios multer cors helmet morgan dotenv bcrypt jsonwebtoken express-rate-limit express-slow-down body-parser cookie-parser uuid validator
```

### **Install with Specific Versions:**
```bash
npm install axios@^1.6.0 multer@^1.4.5 cors@^2.8.5
```

Remember: **Always rebuild your Docker container** after updating package.json!