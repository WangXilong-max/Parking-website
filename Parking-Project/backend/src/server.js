// Parking-Project/backend/src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes & services
import parkingRoutes from './routes/parking.js';
import { startParkingDataSync } from './services/parkingSync.js';

dotenv.config();

// ESM __dirname + dist path (../../dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// --- middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS: dev = localhost only, prod = allow same-origin (frontend + API on one domain)
if (isProd) {
  app.use(cors());
} else {
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || origin.startsWith('http://localhost:')) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
}

// --- simple rate limit on /api
const requestCounts = new Map();
const simpleRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 1000;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  const rec = requestCounts.get(ip);
  if (now > rec.resetTime) {
    rec.count = 1;
    rec.resetTime = now + windowMs;
    return next();
  }
  if (rec.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests', message: 'Please try again later' });
  }
  rec.count++;
  next();
};
app.use('/api', simpleRateLimit);

// --- health
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'Melbourne Parking Backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    version: '1.0.0',
  });
});

// API root info at /api (free up "/" for SPA)
app.get('/api', (_req, res) => {
  res.json({
    message: '🅿️ Melbourne Parking Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      parking: '/api/parking',
    },
    timestamp: new Date().toISOString(),
  });
});

// --- API routes
app.use('/api/parking', parkingRoutes);

// --- serve SPA + fallback (must be before 404)
app.use(express.static(distDir));
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// --- errors
app.use((err, _req, res, _next) => {
  console.error('❌ API error:', err);
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, details: err }),
  });
});

// 404 (unmatched API/static)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// --- boot
async function startServer() {
  try {
    console.log('🚀 Starting Melbourne Parking Backend...');
    console.log('⏰ Starting data sync service...');
    startParkingDataSync();
    app.listen(PORT, () => {
      console.log(`
┌─────────────────────────────────────────┐
│  🅿️  Melbourne Parking Backend API      │
├─────────────────────────────────────────┤
│  🌐 http://localhost:${PORT}                          │
│  📚 API Root: /api                                 │
│  🏥 Health:   /health                              │
│  🅿️ Parking:  /api/parking                         │
│  ⏰ Env: ${process.env.NODE_ENV || 'development'}                        │
└─────────────────────────────────────────┘
      `);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => { console.log('👋 SIGTERM'); process.exit(0); });
process.on('SIGINT', () => { console.log('👋 SIGINT'); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('🚨 Uncaught', e); process.exit(1); });
process.on('unhandledRejection', (r) => { console.error('🚨 Unhandled', r); process.exit(1); });

startServer();
