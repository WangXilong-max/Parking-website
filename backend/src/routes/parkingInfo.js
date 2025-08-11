import express from 'express'
import { ParkingInfoService } from '../services/parkingInfoService.js'

const router = express.Router()
const parkingInfoService = new ParkingInfoService()

// Get parking rate standards
router.get('/rates', async (req, res) => {
  try {
    const rates = await parkingInfoService.getParkingRates()
    res.json({
      success: true,
      data: rates,
      message: 'Parking rate standards retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get parking rate standards:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get parking rate standards',
      error: error.message
    })
  }
})

// Search parking spot information
router.post('/search', async (req, res) => {
  try {
    const { location, duration, budget, radius = 5 } = req.body
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide parking location'
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
      message: `Found ${results.length} matching parking spots`
    })
  } catch (error) {
    console.error('Failed to search parking spots:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to search parking spots',
      error: error.message
    })
  }
})

// Get value-for-money recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { location, duration, budget, limit = 5 } = req.query
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide parking location'
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
      message: 'Value-for-money recommendations retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get recommendations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    })
  }
})

// Get parking spot detailed information
router.get('/spot/:id', async (req, res) => {
  try {
    const { id } = req.params
    const spotDetails = await parkingInfoService.getSpotDetails(id)
    
    if (!spotDetails) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot does not exist'
      })
    }

    res.json({
      success: true,
      data: spotDetails,
      message: 'Parking spot details retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get parking spot details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get parking spot details',
      error: error.message
    })
  }
})

// Calculate parking cost
router.post('/calculate-cost', async (req, res) => {
  try {
    const { zone_id, duration, vehicle_type = 'standard' } = req.body
    
    if (!zone_id || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide zone ID and parking duration'
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
      message: 'Cost calculation successful'
    })
  } catch (error) {
    console.error('Failed to calculate cost:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate cost',
      error: error.message
    })
  }
})

// Get zone statistics
router.get('/zone-stats', async (req, res) => {
  try {
    const stats = await parkingInfoService.getZoneStats()
    res.json({
      success: true,
      data: stats,
      message: 'Zone statistics retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get zone statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get zone statistics',
      error: error.message
    })
  }
})

// Debug endpoint: check data matching status
router.get('/debug-match', async (req, res) => {
  try {
    const debugInfo = await parkingInfoService.getDebugInfo()
    res.json({
      success: true,
      data: debugInfo,
      message: 'Debug information retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get debug information:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get debug information',
      error: error.message
    })
  }
})

export default router
