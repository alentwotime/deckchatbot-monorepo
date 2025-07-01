// Application entry point for AlensDeckBot.online backend
// This file serves as the main entry point that connects all components
// and ensures proper alignment with the frontend domain

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Import route handlers
// import { apiRoutes } from './routes';

// Import middleware
// import { authMiddleware } from './middleware';

// Import services
// import { azureService } from './services';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://alensdeckbot.online',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'AlensDeckBot Backend',
    timestamp: new Date().toISOString()
  });
});

// API routes will be mounted here
// app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AlensDeckBot backend server running on port ${PORT}`);
  console.log(`🌐 Frontend domain: ${process.env.FRONTEND_URL || 'https://alensdeckbot.online'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
