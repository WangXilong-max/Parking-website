import express from 'express';
import { getAllParkingSpots, forceRefreshData } from '../services/parkingService.js';

const router = express.Router();

// 获取所有停车位数据
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('📡 API请求: 获取停车位数据');
    
    const result = await getAllParkingSpots();
    const duration = Date.now() - startTime;
    
    console.log(`✅ 返回 ${result.spots.length} 个停车位, 耗时: ${duration}ms`);
    
    res.json({
      success: true,
      data: result.spots,
      meta: {
        total: result.total,
        cached: result.cached,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
      }
    });
  } catch (error) {
    console.error('❌ 获取停车数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 强制刷新数据
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 API请求: 强制刷新停车数据');
    const startTime = Date.now();
    
    const result = await forceRefreshData();
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: '数据刷新成功',
      data: {
        updated: result.updated,
        total: result.total,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ 刷新数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 健康检查 - 获取缓存统计信息
router.get('/status', async (req, res) => {
  try {
    const result = await getAllParkingSpots();
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        totalSpots: result.data.length,
        cached: result.fromCache,
        lastUpdate: result.lastUpdate,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;