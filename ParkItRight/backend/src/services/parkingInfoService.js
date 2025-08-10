import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ParkingService } from './parkingService.js'
import { calculateDistance, degreesToRadians } from '../utils/common.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class ParkingInfoService {
  constructor() {
    this.parkingZones = new Map()
    this.parkingService = new ParkingService()
    this.loadParkingZones()
  }

  // Load parking zone data from CSV file
  loadParkingZones() {
    try {
      // Correct path from backend/src/services/ to backend/data/
      const csvPath = path.join(__dirname, '../../data/parking_zones.csv')
      
      console.log('Attempting to load CSV file:', csvPath)
      
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8')
        this.parseCSVData(csvData)
      } else {
        console.log('CSV file does not exist, please ensure file path is correct')
        console.log('Current directory:', __dirname)
        console.log('Attempted path:', csvPath)
        throw new Error('CSV file does not exist')
      }
    } catch (error) {
      console.error('Failed to load parking zone data:', error)
      throw error
    }
  }

  // Parse CSV data
  parseCSVData(csvData) {
    const lines = csvData.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim())
      const zoneData = {}
      
      headers.forEach((header, index) => {
        zoneData[header] = values[index] || ''
      })
      
      // Use ParkingZone column as zone_id
      if (zoneData.ParkingZone) {
        // Ensure ParkingZone is string type
        const parkingZoneId = zoneData.ParkingZone.toString()
        this.parkingZones.set(parkingZoneId, {
          parking_zone_id: parkingZoneId,
          restriction_days: zoneData.Restriction_Days,
          time_restriction_start: zoneData.Time_Restrictions_Start,
          time_restriction_finish: zoneData.Time_Restrictions_Finish,
          restriction_display: zoneData.Restriction_Display
        })
      }
    }
    
    console.log(`Loaded ${this.parkingZones.size} parking zones`)
    // Display first few ParkingZones for debugging
    const sampleZones = Array.from(this.parkingZones.keys()).slice(0, 5)
    console.log('First 5 ParkingZones in CSV:', sampleZones)
  }



  // Get parking rate standards
  async getParkingRates() {
    return Array.from(this.parkingZones.values())
  }

  // Distance calculation functions moved to utils/common.js

  // Search parking spots
  async searchParkingSpots({ location, radius = 300 }) {
    try {
      // Use real Melbourne parking data API
      const realSpots = await this.fetchRealTimeData(location, radius)
      
      // Merge parking spot data with zone restriction information
      const enrichedSpots = realSpots.map(spot => {
        const zoneInfo = this.parkingZones.get(spot.parking_zone_id) || {}
        return {
          ...spot,
          restriction_display: zoneInfo.restriction_display || 'Unknown',
          restriction_days: zoneInfo.restriction_days || 'Daily',
          time_restriction_start: zoneInfo.time_restriction_start || '',
          time_restriction_finish: zoneInfo.time_restriction_finish || ''
        }
      })

      console.log(`Returning ${enrichedSpots.length} parking spots, frontend will handle distance filtering and sorting`)
      return enrichedSpots
    } catch (error) {
      console.error('Failed to search parking spots:', error)
      throw error
    }
  }

  // Get real-time parking data
  async fetchRealTimeData(location, radius) {
    try {
      // First geocode the search location
      let searchLat = -37.8136 // Melbourne default coordinates
      let searchLng = 144.9631
      
      if (location && location !== 'Melbourne') {
        try {
          // Use Mapbox geocoding API
          const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1Ijoid3hsMTIzNzg5IiwiYSI6ImNtZHlid2h1bDAwYmEya3BzMmpvbGFzb2UifQ.PNnx74NZhnHUfa5d1Q_c3w'
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&country=AU&bbox=144.5,-38.5,145.5,-37.5`
          
          console.log(`Backend geocoding URL: ${geocodeUrl}`)
          
          const geocodeResponse = await fetch(geocodeUrl)
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()
            console.log(`Backend geocoding response:`, geocodeData)
            if (geocodeData.features && geocodeData.features.length > 0) {
              const [lng, lat] = geocodeData.features[0].center
              searchLat = lat
              searchLng = lng
              console.log(`Backend geocoding successful: "${location}" -> ${lat}, ${lng}`)
            } else {
              console.log(`Backend geocoding no results: "${location}", using default coordinates`)
            }
          } else {
            console.log(`Backend geocoding failed: "${location}", using default coordinates`)
          }
        } catch (error) {
          console.log(`Backend geocoding error: "${location}":`, error.message)
        }
      }

      // Use existing ParkingService to get real data
      const result = await this.parkingService.getParkingSpots({}, 1000, 0)
      
      if (!result.spots || result.spots.length === 0) {
        throw new Error('No parking data retrieved')
      }

      console.log(`Retrieved ${result.spots.length} parking spots`)
      console.log('Number of ParkingZones in CSV:', this.parkingZones.size)
      
      // Detailed debugging: show complete information for first 10 parking spots
      const sampleSpots = result.spots.slice(0, 10)
      console.log('=== Real-time Data Sample ===')
      sampleSpots.forEach((spot, index) => {
        console.log(`${index + 1}. ${spot.street_name}: zone_number=${spot.zone_number} (type: ${typeof spot.zone_number})`)
        // Show all possible fields
        console.log(`   Complete data:`, {
          bay_id: spot.bay_id,
          sensor_id: spot.sensor_id,
          zone_number: spot.zone_number,
          street_name: spot.street_name,
          status: spot.status
        })
      })
      
      // Show first 10 ParkingZones in CSV
      const csvZones = Array.from(this.parkingZones.keys()).slice(0, 10)
      console.log('=== CSV ParkingZone Sample ===')
      csvZones.forEach((zone, index) => {
        console.log(`${index + 1}. ${zone} (type: ${typeof zone})`)
      })

      // Check all parking spots with zone_number
      const spotsWithZone = result.spots.filter(spot => spot.zone_number)
      console.log(`Number of spots with zone_number: ${spotsWithZone.length}`)
      
      // Check matching status
      let matchCount = 0
      const matchedSpots = []
      
      spotsWithZone.forEach(spot => {
        const zoneStr = spot.zone_number.toString()
        if (this.parkingZones.has(zoneStr)) {
          matchCount++
          matchedSpots.push(spot)
          console.log(`✅ Match successful: ${spot.street_name} (zone_number: ${spot.zone_number})`)
        } else {
          console.log(`❌ No match: ${spot.street_name} (zone_number: ${spot.zone_number})`)
        }
      })
      
      console.log(`Total matches: ${matchCount}/${spotsWithZone.length}`)

      // If matched parking spots found, calculate distance first, then filter within 300m range
      if (matchedSpots.length > 0) {
        const spotsWithDistance = matchedSpots.map((spot, index) => {
          // Calculate real distance
          const distance = calculateDistance(
            searchLat, searchLng,
            spot.latitude, spot.longitude
          ) * 1000 // Convert to meters
          
          return {
            id: spot.bay_id || spot.sensor_id || `spot_${index + 1}`,
            parking_zone_id: spot.zone_number.toString(),
            street_name: spot.street_name || 'Unknown Street',
            location: spot.street_name || 'Unknown Location',
            distance: Math.round(distance), // Round to integer
            status: spot.status,
            latitude: spot.latitude,
            longitude: spot.longitude
          }
        })
        
        // Return all matched parking spots, let frontend handle distance filtering
        console.log(`Returning ${spotsWithDistance.length} matched parking spots, frontend will filter within 300m range`)
        return spotsWithDistance
      } else {
        // If no matches, return empty array
        console.log('No matched parking spots found')
        return []
      }
    } catch (error) {
      console.error('Failed to retrieve real parking data:', error)
      throw error
    }
  }



  // Get value-for-money recommendations
  async getRecommendations({ location, limit = 5 }) {
    const spots = await this.searchParkingSpots({ location, radius: 300 })
    
    // Data is already sorted by value in searchParkingSpots, directly return first limit items
    console.log(`Returning top ${limit} best value parking spots`)
    return spots.slice(0, limit)
  }

  // Get parking spot details
  async getSpotDetails(id) {
    const spots = await this.searchParkingSpots({ location: 'Melbourne', radius: 1000 })
    return spots.find(spot => spot.id == id)
  }

  // Calculate parking cost based on restriction type
  async calculateCost({ zone_id, duration }) {
    const zone = this.parkingZones.get(zone_id)
    if (!zone) {
      throw new Error('Parking zone does not exist')
    }

    // Calculate cost based on restriction type
    const restriction = zone.restriction_display
    let cost = 0

    switch (restriction) {
      case '1P':
        cost = duration * 2.50 // 1 hour parking fee
        break
      case '2P':
        cost = Math.min(duration * 2.00, 4.00) // 2 hour parking fee, max $4
        break
      case '4P':
        cost = Math.min(duration * 1.50, 6.00) // 4 hour parking fee, max $6
        break
      case 'MP2P':
        cost = Math.min(duration * 1.75, 3.50) // 2 hour parking fee, max $3.5
        break
      default:
        cost = duration * 3.00 // Default rate
    }

    return {
      zone_id,
      restriction_display: restriction,
      duration,
      cost: Math.round(cost * 100) / 100,
      currency: 'AUD'
    }
  }

  // Get zone statistics
  async getZoneStats() {
    const zones = Array.from(this.parkingZones.values())
    const stats = {
      total_zones: zones.length,
      restriction_types: {},
      average_hours: 0
    }

    zones.forEach(zone => {
      const restriction = zone.restriction_display
      stats.restriction_types[restriction] = (stats.restriction_types[restriction] || 0) + 1
    })

    return stats
  }

  // Reload CSV data
  async reloadCSVData() {
    this.parkingZones.clear()
    this.loadParkingZones()
    return { success: true, message: 'Data reloaded successfully' }
  }

  // Get debug information
  async getDebugInfo() {
    try {
      // Get real-time data sample
      const result = await this.parkingService.getParkingSpots({}, 50, 0)
      const sampleSpots = result.spots.slice(0, 10)
      
      // Get CSV data sample
      const csvZones = Array.from(this.parkingZones.keys()).slice(0, 10)
      
      // Check matching status
      const matchedSpots = sampleSpots.filter(spot => 
        spot.zone_number && this.parkingZones.has(spot.zone_number.toString())
      )
      
      return {
        csv_loaded: this.parkingZones.size > 0,
        csv_sample: csvZones,
        real_data_count: result.spots.length,
        real_data_sample: sampleSpots.map(spot => ({
          street_name: spot.street_name,
          zone_number: spot.zone_number,
          zone_number_type: typeof spot.zone_number
        })),
        matched_count: matchedSpots.length,
        matched_sample: matchedSpots.map(spot => ({
          street_name: spot.street_name,
          zone_number: spot.zone_number,
          csv_info: this.parkingZones.get(spot.zone_number.toString())
        }))
      }
    } catch (error) {
      console.error('Failed to get debug information:', error)
      return {
        error: error.message,
        csv_loaded: this.parkingZones.size > 0,
        csv_sample: Array.from(this.parkingZones.keys()).slice(0, 5)
      }
    }
  }
}
