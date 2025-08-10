import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import parkingRoutes from './routes/parking.js';
import parkingInfoRoutes from './routes/parkingInfo.js';

// Import services
import { startParkingDataSync } from './services/parkingSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware configuration
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from any localhost port, or requests without origin (like Postman)
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple rate limiting middleware
const requestCounts = new Map();
const simpleRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 1000;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userRequests = requestCounts.get(ip);
  
  if (now > userRequests.resetTime) {
    userRequests.count = 1;
    userRequests.resetTime = now + windowMs;
    return next();
  }

  if (userRequests.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }

  userRequests.count++;
  next();
};

app.use('/api', simpleRateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Melbourne Parking Backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Root path
app.get('/', (req, res) => {
  res.json({
    message: '🅿️ Melbourne Parking Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      parking: '/api/parking',
      'parking-info': '/api/parking-info'
    },
    docs: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/parking', parkingRoutes);
app.use('/api/parking-info', parkingInfoRoutes);

// Global error handling
app.use((err, req, res, next) => {
  console.error('❌ API error:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
});

// 404 handling
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Melbourne Parking Backend...');
    
    // Start parking data sync service
    console.log('⏰ Starting data sync service...');
    startParkingDataSync();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`
┌─────────────────────────────────────────┐
│  🅿️  Melbourne Parking Backend API      │
├─────────────────────────────────────────┤
│  🌐 Service URL: http://localhost:${PORT}     │
│  📚 API Root: http://localhost:${PORT}/     │
│  🏥 Health Check: http://localhost:${PORT}/health │
│  🅿️ Parking API: http://localhost:${PORT}/api/parking │
│  ⏰ Environment: ${process.env.NODE_ENV || 'development'}                 │
│  📊 Status: Running                        │
└─────────────────────────────────────────┘

🔥 Server started successfully!
📡 Syncing parking data...
      `);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM signal, gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Received SIGINT signal, gracefully shutting down...');
  process.exit(0);
});

// Catch unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise rejection:', reason);
  process.exit(1);
});

startServer();
