import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// 导入路由
import parkingRoutes from './routes/parking.js';

// 导入服务
import { startParkingDataSync } from './services/parkingSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    // 允许来自localhost的任何端口，或者没有origin的请求（如Postman）
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

// 简单的速率限制中间件
const requestCounts = new Map();
const simpleRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15分钟
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
      error: '请求过于频繁',
      message: '请稍后再试'
    });
  }

  userRequests.count++;
  next();
};

app.use('/api', simpleRateLimit);

// 健康检查端点
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

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '🅿️ Melbourne Parking Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      parking: '/api/parking',
      auth: '/api/auth',
      users: '/api/users'
    },
    docs: 'API正在运行中',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/parking', parkingRoutes);

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('❌ API错误:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
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

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  try {
    console.log('🚀 正在启动 Melbourne Parking Backend...');
    
    // 启动停车数据同步服务
    console.log('⏰ 启动数据同步服务...');
    startParkingDataSync();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`
┌─────────────────────────────────────────┐
│  🅿️  Melbourne Parking Backend API      │
├─────────────────────────────────────────┤
│  🌐 服务地址: http://localhost:${PORT}     │
│  📚 API根路径: http://localhost:${PORT}/     │
│  🏥 健康检查: http://localhost:${PORT}/health │
│  🅿️ 停车API: http://localhost:${PORT}/api/parking │
│  ⏰ 环境: ${process.env.NODE_ENV || 'development'}                 │
│  📊 状态: 运行中                        │
└─────────────────────────────────────────┘

🔥 服务器启动成功！
📡 正在同步停车数据...
      `);
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('👋 收到SIGTERM信号，正在优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 收到SIGINT信号，正在优雅关闭...');
  process.exit(0);
});

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
  console.error('🚨 未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未处理的Promise拒绝:', reason);
  process.exit(1);
});

startServer();
