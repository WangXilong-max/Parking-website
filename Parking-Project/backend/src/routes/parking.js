import express from 'express';
import { getAllParkingSpots, forceRefreshData } from '../services/parkingService.js';

const router = express.Router();

// Get all parking spot data
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('📡 API request: Get parking spot data');
    
    const result = await getAllParkingSpots();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Returned ${result.spots.length} parking spots, duration: ${duration}ms`);
    
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
    console.error('❌ Failed to get parking data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Force refresh data
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 API request: Force refresh parking data');
    const startTime = Date.now();
    
    const result = await forceRefreshData();
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Data refresh successful',
      data: {
        updated: result.updated,
        total: result.total,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Failed to refresh data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check - get cache statistics
router.get('/status', async (req, res) => {
  try {
    const { total, cached, lastUpdated } = await getAllParkingSpots();

    res.json({
      success: true,
      status: 'healthy',
      data: {
        totalSpots: total,
        cached,
        lastUpdate: lastUpdated,
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