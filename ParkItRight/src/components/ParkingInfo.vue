<template>
  <div class="parking-info-container">
    <div class="info-header">
      <h2>Parking Spot Finder</h2>
      <p>Enter your destination to find the best parking deals with pricing information within 300 meters</p>
    </div>

    <!-- 搜索区域 -->
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

    <!-- 结果展示区域 -->
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

    <!-- 无结果提示 -->
    <div v-else-if="searched && !loading" class="no-results">
      <div class="no-results-content">
        <span class="no-results-icon">🚗</span>
        <h3>No nearby parking spots with pricing information found</h3>
        <p>No parking spots within 300m have specific pricing restrictions. Try expanding your search range or choose a different destination.</p>
        <button @click="resetSearch" class="reset-btn">Search Again</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Searching for nearby parking spots...</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BACKEND_CONFIG, MAPBOX_CONFIG } from '../config/mapbox.js'

// 响应式数据
const destination = ref('')
const loading = ref(false)
const searched = ref(false)
const parkingSpots = ref([])

// 定义事件
const emit = defineEmits(['navigate', 'showSpotOnMap'])

// 计算距离函数（与Map页面保持一致）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // 地球半径(公里)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 搜索停车位
const searchParkingSpots = async () => {
  if (!destination.value.trim()) {
    alert('Please enter a destination')
    return
  }

  loading.value = true
  searched.value = true

  try {
    // 首先进行地理编码获取搜索位置的坐标
    let searchLat = -37.8136 // 默认墨尔本坐标
    let searchLng = 144.9631
    
    // 尝试地理编码用户输入的位置
    try {
      const geocodeResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination.value)}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=AU&bbox=144.5,-38.5,145.5,-37.5`)
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        if (geocodeData.features && geocodeData.features.length > 0) {
          const [lng, lat] = geocodeData.features[0].center
          searchLat = lat
          searchLng = lng
          console.log(`ParkingInfo: Geocoded "${destination.value}" to coordinates: ${lat}, ${lng}`)
        } else {
          console.log(`ParkingInfo: No geocoding results for "${destination.value}", using default coordinates`)
        }
      } else {
        console.log(`ParkingInfo: Geocoding failed for "${destination.value}", using default coordinates`)
      }
    } catch (error) {
      console.log(`ParkingInfo: Geocoding error for "${destination.value}":`, error)
    }

    // 获取停车位数据
    const response = await fetch(`${BACKEND_CONFIG.baseURL}/api/parking-info/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: destination.value,
        radius: 1000 // 获取更大范围的数据，前端再筛选
      })
    })

    if (!response.ok) {
      throw new Error('搜索失败')
    }

    const data = await response.json()
    
    if (data.success && data.data.length > 0) {
      console.log('ParkingInfo: Received parking spots:', data.data)
      console.log(`ParkingInfo: Using search coordinates: ${searchLat}, ${searchLng}`)
      
      // 使用前端距离计算筛选300米范围内的停车位
      const nearbySpots = data.data.filter(spot => {
        if (!spot.latitude || !spot.longitude) return false
        
        const distance = calculateDistance(
          searchLat, searchLng,
          parseFloat(spot.latitude), parseFloat(spot.longitude)
        ) * 1000 // 转换为米
        
        // 更新距离为前端计算的距离
        spot.distance = Math.round(distance)
        
        // 只返回300米范围内且有具体扣费情况的停车位
        const hasValidRestriction = spot.restriction_display && 
          spot.restriction_display !== 'Unknown' && 
          spot.restriction_display !== ''
        
        return distance <= 300 && hasValidRestriction
      })
      
      console.log(`ParkingInfo: Found ${nearbySpots.length} spots within 300m with valid restrictions`)
      
      // 按优惠程度排序（在300米范围内）
      const restrictionOrder = {
        '4P': 1,      // 4小时停车 - 最优惠
        'MP4P': 2,    // 4小时停车
        '2P': 3,      // 2小时停车
        'MP2P': 4,    // 2小时停车
        'MP3P': 5,    // 3小时停车
        '1P': 6,      // 1小时停车
        'MP1P': 7,    // 1小时停车
        'LZ30': 8,    // 30分钟停车
        'QP': 9,      // 快速停车
        'SP': 10,     // 特殊停车
        'PP': 11      // 付费停车
      }
      
      nearbySpots.sort((a, b) => {
        const orderA = restrictionOrder[a.restriction_display] || 999
        const orderB = restrictionOrder[b.restriction_display] || 999
        
        if (orderA !== orderB) {
          return orderA - orderB
        }
        
        // 如果限制相同，按距离排序
        return a.distance - b.distance
      })
      
      parkingSpots.value = nearbySpots
      
      // 显示第一个停车位的完整数据结构
      if (parkingSpots.value.length > 0) {
        console.log('ParkingInfo: First spot structure:', parkingSpots.value[0])
      }
    } else {
      parkingSpots.value = []
    }

  } catch (error) {
    console.error('搜索停车位失败:', error)
    // API调用失败时显示错误信息
    parkingSpots.value = []
    alert('搜索失败，请检查网络连接或稍后重试')
  } finally {
    loading.value = false
  }
}



// 获取限制类型样式类
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
    'PP': 'restriction-pp'
  }
  return classes[restriction] || 'restriction-default'
}

// 获取显示名称
const getDisplayName = (spot) => {
  if (spot.street_name && spot.street_name !== 'Unknown Street') {
    return spot.street_name
  }
  // 使用ID生成Parking Lot名称
  const id = spot.id || spot.sensor_id || spot.bay_id || 'Unknown'
  return `Parking Lot ${id}`
}

// 格式化时间限制
const formatTimeRestriction = (spot) => {
  if (!spot.time_restriction_start || !spot.time_restriction_finish) {
    return 'No time restriction'
  }
  return `${spot.time_restriction_start} - ${spot.time_restriction_finish}`
}

// 在地图上显示
const showOnMap = (spot) => {
  console.log('ParkingInfo: showOnMap called with spot:', spot)
  
  // 验证坐标是否存在
  if (!spot.latitude || !spot.longitude) {
    console.error('ParkingInfo: Missing coordinates for spot:', spot)
    alert('无法显示该停车位：缺少坐标信息')
    return
  }
  
  const spotInfo = {
    spotId: spot.id,
    lat: parseFloat(spot.latitude),
    lng: parseFloat(spot.longitude),
    name: getDisplayName(spot)
  }
  console.log('ParkingInfo: emitting showSpotOnMap with:', spotInfo)
  
  // 通知父组件跳转到地图页面并显示指定停车位
  emit('navigate', 'map')
  emit('showSpotOnMap', spotInfo)
}

// 重置搜索
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
