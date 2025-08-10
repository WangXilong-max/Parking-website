import express from 'express'
import { ParkingInfoService } from '../services/parkingInfoService.js'

const router = express.Router()
const parkingInfoService = new ParkingInfoService()

// 获取停车收费标准
router.get('/rates', async (req, res) => {
  try {
    const rates = await parkingInfoService.getParkingRates()
    res.json({
      success: true,
      data: rates,
      message: '停车收费标准获取成功'
    })
  } catch (error) {
    console.error('获取停车收费标准失败:', error)
    res.status(500).json({
      success: false,
      message: '获取停车收费标准失败',
      error: error.message
    })
  }
})

// 搜索停车位信息
router.post('/search', async (req, res) => {
  try {
    const { location, duration, budget, radius = 5 } = req.body
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: '请提供停车位置'
      })
    }

    const results = await parkingInfoService.searchParkingSpots({
      location,
      duration: parseInt(duration) || 2,
      budget: budget ? parseFloat(budget) : null,
      radius: parseFloat(radius)
    })

    res.json({
      success: true,
      data: results,
      message: `找到 ${results.length} 个符合条件的停车位`
    })
  } catch (error) {
    console.error('搜索停车位失败:', error)
    res.status(500).json({
      success: false,
      message: '搜索停车位失败',
      error: error.message
    })
  }
})

// 获取性价比最优推荐
router.get('/recommendations', async (req, res) => {
  try {
    const { location, duration, budget, limit = 5 } = req.query
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: '请提供停车位置'
      })
    }

    const recommendations = await parkingInfoService.getRecommendations({
      location,
      duration: parseInt(duration) || 2,
      budget: budget ? parseFloat(budget) : null,
      limit: parseInt(limit)
    })

    res.json({
      success: true,
      data: recommendations,
      message: '性价比推荐获取成功'
    })
  } catch (error) {
    console.error('获取推荐失败:', error)
    res.status(500).json({
      success: false,
      message: '获取推荐失败',
      error: error.message
    })
  }
})

// 获取停车位详细信息
router.get('/spot/:id', async (req, res) => {
  try {
    const { id } = req.params
    const spotDetails = await parkingInfoService.getSpotDetails(id)
    
    if (!spotDetails) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }

    res.json({
      success: true,
      data: spotDetails,
      message: '停车位详情获取成功'
    })
  } catch (error) {
    console.error('获取停车位详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取停车位详情失败',
      error: error.message
    })
  }
})

// 计算停车费用
router.post('/calculate-cost', async (req, res) => {
  try {
    const { zone_id, duration, vehicle_type = 'standard' } = req.body
    
    if (!zone_id || !duration) {
      return res.status(400).json({
        success: false,
        message: '请提供区域ID和停车时长'
      })
    }

    const cost = await parkingInfoService.calculateCost({
      zone_id,
      duration: parseInt(duration),
      vehicle_type
    })

    res.json({
      success: true,
      data: cost,
      message: '费用计算成功'
    })
  } catch (error) {
    console.error('计算费用失败:', error)
    res.status(500).json({
      success: false,
      message: '计算费用失败',
      error: error.message
    })
  }
})

// 获取区域统计信息
router.get('/zone-stats', async (req, res) => {
  try {
    const stats = await parkingInfoService.getZoneStats()
    res.json({
      success: true,
      data: stats,
      message: '区域统计信息获取成功'
    })
  } catch (error) {
    console.error('获取区域统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取区域统计失败',
      error: error.message
    })
  }
})

// 调试端点：检查数据匹配情况
router.get('/debug-match', async (req, res) => {
  try {
    const debugInfo = await parkingInfoService.getDebugInfo()
    res.json({
      success: true,
      data: debugInfo,
      message: '调试信息获取成功'
    })
  } catch (error) {
    console.error('获取调试信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取调试信息失败',
      error: error.message
    })
  }
})

export default router
