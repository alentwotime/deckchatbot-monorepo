import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';

import routes from './routes.js';
import visionRouter from './visionRouter.js';
import dbService from './utils/db.js';
import cacheService from './utils/cache.js';
import rateLimiters from './middleware/rateLimiting.js';

dotenv.config();

const app = express();

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all routes
app.use(rateLimiters.general);

// Apply speed limiting to slow down heavy users
app.use(rateLimiters.speed);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Database test route with caching and rate limiting
app.get('/db-test', rateLimiters.db, async (req, res) => {
  try {
    const cacheKey = 'db_test_time';

    // Try to get cached result first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return res.json({ 
        success: true, 
        time: cachedResult.time,
        cached: true,
        message: 'Database connection test successful (cached)'
      });
    }

    // If not cached, query database
    const result = await dbService.query('SELECT NOW() as current_time');
    const responseData = {
      time: result.rows[0].current_time,
      cached: false
    };

    // Cache the result for 30 seconds
    await cacheService.set(cacheKey, responseData, 30);

    console.log('✅ Database connection test successful!');
    res.json({ 
      success: true, 
      ...responseData,
      message: 'Database connection test successful'
    });
  } catch (err) {
    console.error('❌ Database connection test failed:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      message: err.message 
    });
  }
});

// Cache management endpoints
app.post('/cache/clear', rateLimiters.db, async (req, res) => {
  try {
    await cacheService.clear();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/cache/stats', rateLimiters.db, async (req, res) => {
  try {
    // This would need to be implemented based on your cache service
    res.json({ 
      success: true, 
      message: 'Cache statistics endpoint',
      note: 'Implement cache statistics based on your Redis/memory cache setup'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply specific rate limiting to routes
app.use('/api', routes);
app.use('/vision', rateLimiters.ai, visionRouter);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialize database indexes on startup
async function initializeServer() {
  try {
    console.log('🚀 Initializing server...');

    // Initialize database indexes for better performance
    await dbService.initializeIndexes();
    console.log('✅ Database indexes initialized');

    console.log('✅ Server initialization complete');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    // Don't exit - let the server start anyway
  }
}

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`🚀 Backend server listening on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  // Initialize server components
  await initializeServer();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');

  try {
    await dbService.disconnect();
    await cacheService.disconnect();
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');

  try {
    await dbService.disconnect();
    await cacheService.disconnect();
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
