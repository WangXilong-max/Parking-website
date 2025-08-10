<template>
  <div class="parking-info-container">
    <div class="info-header">
      <h2>Parking Spot Finder</h2>
      <p>Enter your destination to find the best parking deals within 300 meters</p>
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
        <h3>Nearby Parking Spots (within 300m)</h3>
        <span class="result-count">Found {{ parkingSpots.length }} parking spots</span>
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
              <h4>{{ spot.street_name }}</h4>
              <span class="distance">{{ spot.distance }}m</span>
            </div>
            <div class="restriction-badge" :class="getRestrictionClass(spot.restriction_display)">
              {{ spot.restriction_display }}
            </div>
          </div>
          
          <div class="spot-details">
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">{{ spot.location }}</span>
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
            <button @click="selectSpot(spot)" class="select-btn">
              Select This Spot
            </button>
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
        <h3>No nearby parking spots found</h3>
        <p>Try expanding your search range or choose a different destination</p>
        <button @click="resetSearch" class="reset-btn">Search Again</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Searching for nearby parking spots...</p>
    </div>

    <!-- 选择确认模态框 -->
    <div v-if="selectedSpot" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirm Selection</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-spot-info">
            <h4>{{ selectedSpot.street_name }}</h4>
            <p class="spot-location">{{ selectedSpot.location }}</p>
                         <div class="restriction-info">
               <div class="restriction-item">
                 <span class="restriction-label">Parking Restriction:</span>
                 <span class="restriction-value">{{ selectedSpot.restriction_display }}</span>
               </div>
               <div class="restriction-item">
                 <span class="restriction-label">Time:</span>
                 <span class="restriction-value">{{ formatTimeRestriction(selectedSpot) }}</span>
               </div>
               <div class="restriction-item">
                 <span class="restriction-label">Distance:</span>
                 <span class="restriction-value">{{ selectedSpot.distance }}m</span>
               </div>
             </div>
          </div>
        </div>
                 <div class="modal-footer">
           <button @click="closeModal" class="cancel-btn">Cancel</button>
           <button @click="confirmSelection" class="confirm-btn">Confirm Selection</button>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BACKEND_CONFIG } from '../config/mapbox.js'

// 响应式数据
const destination = ref('')
const loading = ref(false)
const searched = ref(false)
const parkingSpots = ref([])
const selectedSpot = ref(null)

// 搜索停车位
const searchParkingSpots = async () => {
  if (!destination.value.trim()) {
    alert('Please enter a destination')
    return
  }

  loading.value = true
  searched.value = true

  try {
    // 调用后端API
    const response = await fetch(`${BACKEND_CONFIG.baseURL}/api/parking-info/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location: destination.value,
        radius: 300 // 300米范围
      })
    })

    if (!response.ok) {
      throw new Error('搜索失败')
    }

    const data = await response.json()
    
    if (data.success) {
      parkingSpots.value = data.data
      // 按优惠程度排序 (4P > 2P > 1P > MP2P)
      sortByRestriction()
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



// 按停车限制排序（优惠程度）
const sortByRestriction = () => {
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

  parkingSpots.value.sort((a, b) => {
    const orderA = restrictionOrder[a.restriction_display] || 999
    const orderB = restrictionOrder[b.restriction_display] || 999
    
    if (orderA !== orderB) {
      return orderA - orderB
    }
    
    // 如果限制相同，按距离排序
    return a.distance - b.distance
  })
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

// 格式化时间限制
const formatTimeRestriction = (spot) => {
  if (!spot.time_restriction_start || !spot.time_restriction_finish) {
    return 'No time restriction'
  }
  return `${spot.time_restriction_start} - ${spot.time_restriction_finish}`
}

// 选择停车位
const selectSpot = (spot) => {
  selectedSpot.value = spot
}

// 在地图上显示
const showOnMap = (spot) => {
  // 这里可以触发地图组件显示该位置
  alert(`Show on map: ${spot.street_name}`)
}

// 确认选择
const confirmSelection = () => {
  alert(`Selected parking spot: ${selectedSpot.value.street_name}`)
  closeModal()
}

// 关闭模态框
const closeModal = () => {
  selectedSpot.value = null
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
  padding: 12px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  background: #2980b9;
}

.search-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
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
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  border: 2px solid transparent;
}

.spot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.spot-card.best-option {
  border-color: #f39c12;
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
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
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.restriction-badge {
  padding: 8px 12px;
  border-radius: 20px;
  font-weight: bold;
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
  gap: 10px;
}

.select-btn, .map-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.select-btn {
  background: #27ae60;
  color: white;
}

.select-btn:hover {
  background: #229954;
}

.map-btn {
  background: #ecf0f1;
  color: #2c3e50;
}

.map-btn:hover {
  background: #d5dbdb;
}

.best-option-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #f39c12;
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(243, 156, 18, 0.3);
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
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-body {
  padding: 20px;
}

.selected-spot-info h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.spot-location {
  color: #7f8c8d;
  margin-bottom: 20px;
}

.restriction-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.restriction-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e1e8ed;
}

.restriction-item:last-child {
  border-bottom: none;
}

.restriction-label {
  font-weight: 600;
  color: #7f8c8d;
}

.restriction-value {
  color: #2c3e50;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  justify-content: flex-end;
}

.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: #ecf0f1;
  color: #2c3e50;
}

.confirm-btn {
  background: #3498db;
  color: white;
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
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>
