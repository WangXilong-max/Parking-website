import express from 'express';
import chartDataService from '../services/chartDataService.js';

const router = express.Router();

// 获取所有图表数据
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('📡 API request: Get chart data for dashboard');
    
    const chartData = await chartDataService.getAllChartData();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Chart data retrieved successfully, duration: ${duration}ms`);
    console.log(`  - Population records: ${chartData.population.length}`);
    console.log(`  - Vehicle records: ${chartData.vehicle.length}`);
    console.log(`  - Density records: ${chartData.density.length}`);
    
    res.json({
      success: true,
      data: chartData,
      meta: {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        records: {
          population: chartData.population.length,
          vehicle: chartData.vehicle.length,
          density: chartData.density.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get chart data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 只获取人口数据
router.get('/population', async (req, res) => {
  try {
    const populationData = await chartDataService.getPopulationData();
    
    res.json({
      success: true,
      data: populationData,
      meta: {
        timestamp: new Date().toISOString(),
        records: populationData.length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get population data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 只获取车辆数据
router.get('/vehicle', async (req, res) => {
  try {
    const vehicleData = await chartDataService.getVehicleData();
    
    res.json({
      success: true,
      data: vehicleData,
      meta: {
        timestamp: new Date().toISOString(),
        records: vehicleData.length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get vehicle data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
