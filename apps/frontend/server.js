import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Middleware imports
import auth from './middleware/auth.js';
import rateLimiter from './middleware/rateLimiter.js';
import errorLogger from './middleware/errorLogger.js';
import requestLogger from './middleware/requestLogger.js';
import routes from './routes/index.js';
import logger from './src/utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security & optimization middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes with authentication
app.use('/api', auth, routes);

// Public routes (no auth required)
app.use('/', routes);

// Error handling
app.use(errorLogger);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Deck Chatbot Server running on http://localhost:${PORT}`);
});

export { app, logger };
