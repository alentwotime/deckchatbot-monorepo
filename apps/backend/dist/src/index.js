// Application entry point for AlensDeckBot.online backend
// This file serves as the main entry point that connects all components
// and ensures proper alignment with the frontend domain
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import winston from 'winston';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import path from 'path';
import { fileURLToPath } from 'url';
// Import route handlers
import apiRoutes from './routes/index.js';
// Import Azure services
import { azureCosmos } from './services/azure-cosmos.js';
import { azureOpenAI } from './services/azure-openai.js';
import { azureComputerVision } from './services/azure-computer-vision.js';
import { azureStorage } from './services/azure-storage.js';
// Load environment variables
config();
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Configure Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'deckchatbot-backend' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }));
}
// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
});
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
// Initialize Socket.IO with CORS configuration
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'https://alensdeckbot.online',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});
// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
// Compression middleware
app.use(compression());
// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://alensdeckbot.online',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting middleware
app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    }
    catch (rejRes) {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
        });
    }
});
// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});
// Static file serving for frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
}));
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    const healthStatus = {
        status: 'healthy',
        service: 'AlensDeckBot Backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {
            cosmos: 'unknown',
            openai: 'unknown',
            computerVision: 'unknown',
            storage: 'unknown'
        }
    };
    try {
        // Check Azure services health
        const [cosmosHealth, openaiHealth, visionHealth, storageHealth] = await Promise.allSettled([
            azureCosmos.healthCheck(),
            azureOpenAI.healthCheck(),
            azureComputerVision.healthCheck(),
            azureStorage.healthCheck()
        ]);
        healthStatus.services.cosmos = cosmosHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy';
        healthStatus.services.openai = openaiHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy';
        healthStatus.services.computerVision = visionHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy';
        healthStatus.services.storage = storageHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy';
        const allHealthy = Object.values(healthStatus.services).every(status => status === 'healthy');
        healthStatus.status = allHealthy ? 'healthy' : 'degraded';
        res.status(allHealthy ? 200 : 503).json(healthStatus);
    }
    catch (error) {
        logger.error('Health check failed:', error);
        healthStatus.status = 'unhealthy';
        res.status(503).json(healthStatus);
    }
});
// API routes
app.use('/api/v1', apiRoutes);
// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            logger.error('Error serving frontend:', err);
            res.status(404).json({ error: 'Frontend not found' });
        }
    });
});
// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);
    // Join user-specific room
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        logger.info(`User ${userId} joined room: user-${userId}`);
    });
    // Handle chat streaming
    socket.on('stream-chat', async (data) => {
        try {
            const { sessionId, message, userId } = data;
            // Emit acknowledgment
            socket.emit('stream-start', { sessionId });
            // Here you would integrate with your chat service
            // For now, just emit a sample response
            socket.emit('stream-chunk', {
                sessionId,
                chunk: 'This is a streaming response chunk...',
                timestamp: new Date().toISOString()
            });
            socket.emit('stream-end', { sessionId });
        }
        catch (error) {
            logger.error('WebSocket chat streaming error:', error);
            socket.emit('stream-error', { error: 'Failed to process chat stream' });
        }
    });
    // Handle deck analysis updates
    socket.on('analyze-deck', (data) => {
        const { deckId, userId } = data;
        // Emit progress updates during deck analysis
        socket.emit('analysis-progress', { deckId, progress: 25, stage: 'Parsing deck list' });
        socket.emit('analysis-progress', { deckId, progress: 50, stage: 'Analyzing mana curve' });
        socket.emit('analysis-progress', { deckId, progress: 75, stage: 'Generating suggestions' });
        socket.emit('analysis-complete', { deckId, progress: 100, stage: 'Analysis complete' });
    });
    socket.on('disconnect', (reason) => {
        logger.info(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});
// Initialize Azure services
async function initializeAzureServices() {
    logger.info('Initializing Azure services...');
    try {
        // Initialize services in parallel
        await Promise.all([
            azureCosmos.initializeClient(),
            azureOpenAI.initializeOpenAI(),
            azureComputerVision.initializeClient(),
            azureStorage.initializeClient()
        ]);
        logger.info('✅ All Azure services initialized successfully');
    }
    catch (error) {
        logger.error('❌ Failed to initialize Azure services:', error);
        throw error;
    }
}
// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close((err) => {
        if (err) {
            logger.error('Error during server shutdown:', err);
            process.exit(1);
        }
        logger.info('Server closed successfully');
        // Close WebSocket connections
        io.close(() => {
            logger.info('WebSocket server closed');
            // Additional cleanup can be added here
            logger.info('Graceful shutdown completed');
            process.exit(0);
        });
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};
// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
// Start server
async function startServer() {
    try {
        // Initialize Azure services first
        await initializeAzureServices();
        // Start the server
        server.listen(PORT, () => {
            logger.info(`🚀 AlensDeckBot backend server running on port ${PORT}`);
            logger.info(`🌐 Frontend domain: ${process.env.FRONTEND_URL || 'https://alensdeckbot.online'}`);
            logger.info(`📊 Health check: http://localhost:${PORT}/health`);
            logger.info(`🔌 WebSocket server ready for real-time connections`);
            logger.info(`📁 Static files served from: ${frontendPath}`);
            logger.info(`🛡️  Security middleware enabled`);
            logger.info(`⚡ Compression enabled`);
            logger.info(`🚦 Rate limiting: 100 requests per minute per IP`);
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the application
startServer();
export default app;
export { io };
//# sourceMappingURL=index.js.map