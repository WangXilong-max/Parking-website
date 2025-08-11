<template>
  <div class="parking-info-container">
    <div class="info-header">
      <h2>Parking Spot Finder</h2>
      <p>Enter your destination to find the best parking deals with pricing information within 300 meters</p>
    </div>

    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label for="destination">Destination</label>
          <input
            id="destination"
            v-model="destination"
            @keyup.enter="searchParkingSpots"
            type="text"
            placeholder="Enter your destination..."
            class="form-input"
          >
        </div>
        <button @click="searchParkingSpots" :disabled="loading" class="search-btn">
          {{ loading ? 'Searching...' : 'Find Parking Spots' }}
        </button>
      </div>
    </div>

    <div v-if="parkingSpots.length > 0" class="results-section">
      <div class="results-header">
        <h3>Nearby Parking Spots with Pricing (within 300m)</h3>
        <span class="result-count">Found {{ parkingSpots.length }} parking spots with pricing information</span>
      </div>

      <div class="spots-list">
        <div
          v-for="(spot, index) in parkingSpots"
          :key="spot.id"
          class="spot-card"
          :class="{ 'best-option': index === 0 }"
        >
          <div class="spot-header">
            <div class="spot-info">
              <h4>{{ getDisplayName(spot) }}</h4>
              <span class="distance">{{ spot.distance }}m</span>
            </div>
            <div class="restriction-badge" :class="getRestrictionClass(spot.restriction_display)">
              {{ spot.restriction_display }}
            </div>
          </div>
          
          <div class="spot-details">
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">{{ getDisplayName(spot) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time Restriction:</span>
              <span class="value">{{ formatTimeRestriction(spot) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Applicable Days:</span>
              <span class="value">{{ spot.restriction_days || 'Daily' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="status" :class="spot.status === 'Available' ? 'available' : 'occupied'">
                {{ spot.status === 'Available' ? '🟢 Available' : '🔴 Occupied' }}
              </span>
            </div>
          </div>

          <div class="spot-actions">
            <button @click="showOnMap(spot)" class="map-btn">
              Show on Map
            </button>
          </div>

          <div v-if="index === 0" class="best-option-badge">
            ⭐ Best Deal
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="searched && !loading" class="no-results">
      <div class="no-results-content">
        <span class="no-results-icon">🚗</span>
        <h3>No nearby parking spots with pricing information found</h3>
        <p>No parking spots within 300m have specific pricing restrictions. Try expanding your search range or choose a different destination.</p>
        <button @click="resetSearch" class="reset-btn">Search Again</button>
      </div>
    </div>

    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Searching for nearby parking spots...</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BACKEND_CONFIG, MAPBOX_CONFIG } from '../config/mapbox.js'
import { calculateDistance, getDisplayName } from '../utils/common.js'
import { MELBOURNE_COORDINATES, DISTANCE, RESTRICTION_ORDER } from '../constants/app.js'

const destination = ref('')
const loading = ref(false)
const searched = ref(false)
const parkingSpots = ref([])

// Define events
const emit = defineEmits(['navigate', 'showSpotOnMap'])

// Distance calculation functions moved to utils/common.js

// Search parking spots
const searchParkingSpots = async () => {
  if (!destination.value.trim()) {
    alert('Please enter a destination')
    return
  }

  loading.value = true
  searched.value = true

  try {
    // First geocode to get coordinates of search location
    let searchLat = MELBOURNE_COORDINATES.DEFAULT_LAT
    let searchLng = MELBOURNE_COORDINATES.DEFAULT_LNG
    
    // Try to geocode user input location
    try {
      const geocodeResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination.value)}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=AU&bbox=144.5,-38.5,145.5,-37.5`)
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        if (geocodeData.features && geocodeData.features.length > 0) {
          const [lng, lat] = geocodeData.features[0].center
          searchLat = lat
          searchLng = lng
          console.log(`ParkingInfo: Geocoded "${destination.value}" to coordinates: ${lat}, ${lng}`)
          console.log(`ParkingInfo: Resolved to address: ${geocodeData.features[0].place_name}`)
          
          // 检查地址解析是否准确
          const resolvedAddress = geocodeData.features[0].place_name.toLowerCase()
          const searchTerm = destination.value.toLowerCase()
          
          // 如果搜索Collins St但解析结果不包含Collins，尝试其他strategies
          if (searchTerm.includes('collins') && !resolvedAddress.includes('collins')) {
            console.log(`⚠️ ParkingInfo: Address mismatch detected. Searching for: "${destination.value}", got: "${geocodeData.features[0].place_name}"`)
            
            // 尝试使用Collins Street的中心坐标
            if (searchTerm.includes('collins')) {
              searchLat = -37.8168
              searchLng = 144.9663
              console.log(`🔧 ParkingInfo: Using Collins Street center coordinates: ${searchLat}, ${searchLng}`)
            }
          }
          
          // 如果搜索Elizabeth St但解析结果不包含Elizabeth，使用Elizabeth St中心坐标
          if (searchTerm.includes('elizabeth') && !resolvedAddress.includes('elizabeth')) {
            console.log(`⚠️ ParkingInfo: Address mismatch detected. Searching for: "${destination.value}", got: "${geocodeData.features[0].place_name}"`)
            
            if (searchTerm.includes('elizabeth')) {
              searchLat = -37.8114
              searchLng = 144.9957
              console.log(`🔧 ParkingInfo: Using Elizabeth Street center coordinates: ${searchLat}, ${searchLng}`)
            }
          }
        } else {
          console.log(`ParkingInfo: No geocoding results for "${destination.value}", using default coordinates`)
        }
      } else {
        console.log(`ParkingInfo: Geocoding failed for "${destination.value}", using default coordinates`)
      }
    } catch (error) {
      console.log(`ParkingInfo: Geocoding error for "${destination.value}":`, error)
    }

    // Get parking spot data - 使用与ParkingMap相同的API端点
    const response = await fetch(`${BACKEND_CONFIG.baseURL}/api/parking`)

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data = await response.json()
    
    if (data.success && data.data.length > 0) {
      console.log('ParkingInfo: Received parking spots:', data.data.length)
      console.log(`ParkingInfo: Using search coordinates: ${searchLat}, ${searchLng}`)
      
      // 获取收费信息数据，与后端同步
      let parkingZones = new Map()
      try {
        const zonesResponse = await fetch(`${BACKEND_CONFIG.baseURL}/api/parking-info/rates`)
        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json()
          if (zonesData.success && zonesData.data) {
            zonesData.data.forEach(zone => {
              parkingZones.set(zone.parking_zone_id, zone)
            })
            console.log(`ParkingInfo: Loaded ${parkingZones.size} parking zones for pricing info`)
          }
        }
      } catch (error) {
        console.log('ParkingInfo: Failed to load parking zones:', error)
      }
      
      // Use frontend distance calculation to filter spots within 300m
      const nearbySpots = data.data.filter(spot => {
        if (!spot.latitude || !spot.longitude) return false
        
        const distance = calculateDistance(
          searchLat, searchLng,
          parseFloat(spot.latitude), parseFloat(spot.longitude)
        ) * 1000 // Convert to meters
        
        // Update distance to frontend calculated distance
        spot.distance = Math.round(distance)
        
        // 只显示300米范围内的停车位，与ParkingMap保持一致
        const withinRadius = distance <= DISTANCE.SEARCH_RADIUS
        
        if (withinRadius) {
          // 添加收费信息
          if (spot.zone_number && parkingZones.has(spot.zone_number.toString())) {
            const zoneInfo = parkingZones.get(spot.zone_number.toString())
            spot.restriction_display = zoneInfo.restriction_display || 'No pricing info'
            spot.restriction_days = zoneInfo.restriction_days || 'Daily'
            spot.time_restriction_start = zoneInfo.time_restriction_start || ''
            spot.time_restriction_finish = zoneInfo.time_restriction_finish || ''
          } else {
            spot.restriction_display = 'No pricing info'
          }
          
          return true
        }
        
        return false
      })
      
      console.log(`ParkingInfo: Found ${nearbySpots.length} spots within ${DISTANCE.SEARCH_RADIUS}m (same as ParkingMap filtering)`)
      
      // Sort by value (within search radius range)
      nearbySpots.sort((a, b) => {
        // 优先显示有收费信息的停车位
        const aHasInfo = a.restriction_display && a.restriction_display !== 'No pricing info'
        const bHasInfo = b.restriction_display && b.restriction_display !== 'No pricing info'
        
        if (aHasInfo && !bHasInfo) return -1
        if (!aHasInfo && bHasInfo) return 1
        
        // 如果都有收费信息，按收费类型排序
        if (aHasInfo && bHasInfo) {
          const orderA = RESTRICTION_ORDER[a.restriction_display] || 999
          const orderB = RESTRICTION_ORDER[b.restriction_display] || 999
          
          if (orderA !== orderB) {
            return orderA - orderB
          }
        }
        
        // 最后按距离排序
        return a.distance - b.distance
      })
      
      parkingSpots.value = nearbySpots
      
      // Display complete data structure of first parking spot
      if (parkingSpots.value.length > 0) {
        console.log('ParkingInfo: First spot structure:', parkingSpots.value[0])
      }
    } else {
      parkingSpots.value = []
    }

  } catch (error) {
    console.error('Failed to search parking spots:', error)
    // Show error message when API call fails
    parkingSpots.value = []
    alert('Search failed, please check network connection or try again later')
  } finally {
    loading.value = false
  }
}



// Get restriction type style class
const getRestrictionClass = (restriction) => {
  const classes = {
    '4P': 'restriction-4p',
    'MP4P': 'restriction-4p',
    '2P': 'restriction-2p',
    'MP2P': 'restriction-2p',
    'MP3P': 'restriction-3p',
    '1P': 'restriction-1p',
    'MP1P': 'restriction-1p',
    'LZ30': 'restriction-lz30',
    'QP': 'restriction-qp',
    'SP': 'restriction-sp',
    'PP': 'restriction-pp',
    'No pricing info': 'restriction-no-info'
  }
  return classes[restriction] || 'restriction-default'
}

// Display name functions moved to utils/common.js

// Format time restriction
const formatTimeRestriction = (spot) => {
  if (!spot.time_restriction_start || !spot.time_restriction_finish) {
    return 'No time restriction'
  }
  return `${spot.time_restriction_start} - ${spot.time_restriction_finish}`
}

// Show on map
const showOnMap = (spot) => {
  console.log('ParkingInfo: showOnMap called with spot:', spot)
  
  // Verify coordinates exist
  if (!spot.latitude || !spot.longitude) {
    console.error('ParkingInfo: Missing coordinates for spot:', spot)
    alert('Unable to display this parking spot: missing coordinate information')
    return
  }
  
  const spotInfo = {
    spotId: spot.id,
    lat: parseFloat(spot.latitude),
    lng: parseFloat(spot.longitude),
    name: getDisplayName(spot)
  }
  console.log('ParkingInfo: emitting showSpotOnMap with:', spotInfo)
  
  // Notify parent component to navigate to map page and show specified parking spot
  emit('navigate', 'map')
  emit('showSpotOnMap', spotInfo)
}

// Reset search
const resetSearch = () => {
  destination.value = ''
  parkingSpots.value = []
  searched.value = false
}
</script>

<style scoped>
.parking-info-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  height: 100vh;
  overflow-y: auto;
}

.info-header {
  text-align: center;
  margin-bottom: 30px;
}

.info-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.info-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.search-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.search-form {
  display: flex;
  gap: 15px;
  align-items: end;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 0;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  background: white;
}

.form-input:focus {
  border-color: #007cbf;
}

.search-btn {
  background: transparent;
  color: #007cbf;
  border: none;
  padding: 12px 24px;
  border-radius: 0;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: underline;
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  background: rgba(0, 124, 191, 0.1);
  color: #005a8b;
}

.search-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
  text-decoration: none;
}

.results-section {
  margin-top: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header h3 {
  color: #2c3e50;
  margin: 0;
}

.result-count {
  color: #7f8c8d;
  font-size: 14px;
}

.spots-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

/* 自定义滚动条样式 */
.spots-list::-webkit-scrollbar {
  width: 8px;
}

.spots-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.spots-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.spots-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.spot-card {
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  border: 1px solid #e9ecef;
}

.spot-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.spot-card.best-option {
  border-color: #f39c12;
  background: #fff9e6;
}

.spot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.spot-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 18px;
}

.distance {
  background: #e8f4fd;
  color: #3498db;
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 500;
}

.restriction-badge {
  padding: 6px 10px;
  border-radius: 2px;
  font-weight: 500;
  font-size: 14px;
  color: white;
}

.restriction-4p {
  background: #27ae60;
}

.restriction-2p {
  background: #f39c12;
}

.restriction-1p {
  background: #e74c3c;
}

.restriction-3p {
  background: #e67e22;
}

.restriction-lz30 {
  background: #34495e;
}

.restriction-qp {
  background: #16a085;
}

.restriction-sp {
  background: #8e44ad;
}

.restriction-pp {
  background: #c0392b;
}

.restriction-default {
  background: #7f8c8d;
}

.spot-details {
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  color: #7f8c8d;
  font-size: 14px;
}

.value {
  color: #2c3e50;
  font-weight: 500;
}

.status {
  font-weight: 600;
}

.status.available {
  color: #27ae60;
}

.status.occupied {
  color: #e74c3c;
}

.spot-actions {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.map-btn {
  background: transparent;
  color: #007cbf;
  border: none;
  padding: 10px 20px;
  border-radius: 0;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: underline;
  font-size: 14px;
}

.map-btn:hover {
  background: rgba(0, 124, 191, 0.1);
  color: #005a8b;
}

.best-option-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f39c12;
  color: white;
  padding: 6px 10px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(243, 156, 18, 0.3);
}

.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results-content {
  max-width: 400px;
  margin: 0 auto;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 20px;
  display: block;
}

.no-results h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.no-results p {
  color: #7f8c8d;
  margin-bottom: 20px;
}

.reset-btn {
  background: transparent;
  color: #007cbf;
  border: none;
  padding: 12px 24px;
  border-radius: 0;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: underline;
}

.reset-btn:hover {
  background: rgba(0, 124, 191, 0.1);
  color: #005a8b;
}

.loading-section {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    gap: 15px;
  }
  
  .spot-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .spot-actions {
    flex-direction: column;
  }
}
</style>
