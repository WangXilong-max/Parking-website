// backend/src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import parkingRoutes from './routes/parking.js';
import parkingInfoRoutes from './routes/parkingInfo.js';

// Services
import { startParkingDataSync } from './services/parkingSync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

/* ---------- Security / infra ---------- */
app.set('trust proxy', 1); // behind Railway/Cloudflare

app.use(
  helmet({
    contentSecurityPolicy: false, // tighten later
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ---------- Allowed frontend origins via env ---------- */
/* FRONTEND_ORIGINS="https://your-frontend.up.railway.app,http://localhost:5173" */
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/* ---------- Body parsers ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ---------- Simple in-memory rate limit (API only) ---------- */
const requestCounts = new Map();
const simpleRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 min
  const maxRequests = 1000;

  const rec = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > rec.resetTime) {
    rec.count = 0;
    rec.resetTime = now + windowMs;
  }
  rec.count += 1;
  requestCounts.set(ip, rec);

  if (rec.count > maxRequests) {
    return res
      .status(429)
      .json({ error: 'Too many requests', retryAfterMs: rec.resetTime - now });
  }
  next();
};
app.use('/api', simpleRateLimit);

/* ---------- Serve frontend build (MUST come before API) ---------- */
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

/* ---------- Health ---------- */
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'Melbourne Parking Backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
  });
});

/* ---------- API info (not at "/") ---------- */
app.get('/api', (_req, res) => {
  res.json({
    message: '🅿️ Melbourne Parking Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      parking: '/api/parking',
      parkingInfo: '/api/parking-info',
    },
    timestamp: new Date().toISOString(),
  });
});

/* ---------- CORS (apply ONLY to /api) ---------- */
const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // server-to-server, curl, same-origin
    if (origin.startsWith('http://localhost:')) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};
app.use('/api', cors(corsOptions));

/* ---------- API routes ---------- */
app.use('/api/parking', parkingRoutes);
app.use('/api/parking-info', parkingInfoRoutes);

/* ---------- 404 for API only ---------- */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

/* ---------- SPA fallback (MUST be last) ---------- */
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/* ---------- Global error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error('❌ API error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

/* ---------- Start ---------- */
async function startServer() {
  try {
    console.log('🚀 Starting Melbourne Parking Backend...');
    console.log('⏰ Starting data sync service...');
    startParkingDataSync();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
┌─────────────────────────────────────────┐
│  🅿️  Melbourne Parking Backend API      │
├─────────────────────────────────────────┤
│  🌐 URL: http://0.0.0.0:${PORT}
│  🏥 Health: /health
│  🅿️ API:    /api/parking
│  📦 Static:  ${distPath}
│  ⏰ Env:     ${process.env.NODE_ENV || 'development'}
└─────────────────────────────────────────┘
      `);
    });
  } catch (e) {
    console.error('❌ Server startup failed:', e);
    process.exit(1);
  }
}

/* ---------- Signals ---------- */
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    console.log(`👋 Received ${sig}, shutting down...`);
    process.exit(0);
  });
}
process.on('uncaughtException', (e) => {
  console.error('🚨 Uncaught exception:', e);
  process.exit(1);
});
process.on('unhandledRejection', (r) => {
  console.error('🚨 Unhandled rejection:', r);
  process.exit(1);
});

startServer();
