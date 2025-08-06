<template>
  <div class="map-container">
    <div class="map-header">
      <h2>Melbourne Parking Map</h2>
      <div class="search-container">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            @keyup.enter="searchLocation"
            type="text" 
            placeholder="Search for a location in Melbourne..."
            class="search-input"
          >
          <button @click="searchLocation" :disabled="searching" class="search-btn">
            {{ searching ? 'Searching...' : 'Search' }}
          </button>
          <button @click="resetView" class="reset-btn" v-if="searchQuery">
            Show All
          </button>
          <button @click="loadParkingData" :disabled="loading" class="refresh-btn">
            {{ loading ? 'Loading...' : '🔄 Refresh Data' }}
          </button>
        </div>
      </div>
      <div class="controls">
        <div class="info">
          <div class="data-status">
            <span v-if="parkingCount > 0">📍 Total: {{ parkingCount }} | 🟢 Available: {{ availableCount }} | 🔴 Occupied: {{ occupiedCount }}</span>
            <span v-if="isFiltered" class="filter-status">🔍 显示 {{ searchLocationName }} 300米范围内的停车位</span>
            <span v-if="parkingCount === 0 && !loading" class="no-data">🔄 Click "Refresh Data" to load parking information</span>
            <span v-if="parkingCount > 0" class="data-source" :class="{ 'real-data': usingRealData, 'mock-data': !usingRealData }">
              {{ dataSource }}
            </span>
          </div>
          <div class="legend">
            <span class="legend-item">
              <span class="legend-dot available"></span>Available/Free
            </span>
            <span class="legend-item">
              <span class="legend-dot occupied"></span>Occupied
            </span>
          </div>
        </div>
      </div>
    </div>
    <div ref="mapContainer" class="map" id="map"></div>
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading parking data from backend...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_CONFIG, BACKEND_CONFIG } from '../config/mapbox.js'

const mapContainer = ref(null)
const loading = ref(false)
const searching = ref(false)
const parkingCount = ref(0)
const availableCount = ref(0)
const occupiedCount = ref(0)
const searchQuery = ref('')
const usingRealData = ref(false)
const dataSource = ref('🔧 Ready to load data')
let map = null
let allParkingSpots = []
let searchMarker = null
const isFiltered = ref(false) // 新增：是否在过滤状态
const searchLocationName = ref('') // 改名避免冲突

// Backend API configuration - 动态获取
const BACKEND_URL = BACKEND_CONFIG.baseURL

console.log('🌐 连接到后端:', BACKEND_URL)

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

const initializeMap = () => {
  mapboxgl.accessToken = MAPBOX_CONFIG.accessToken
  
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAPBOX_CONFIG.styles.streets,
    center: MAPBOX_CONFIG.melbourne.center,
    zoom: MAPBOX_CONFIG.melbourne.zoom
  })

  map.addControl(new mapboxgl.NavigationControl())
  map.addControl(new mapboxgl.FullscreenControl())

  map.on('load', () => {
    console.log('地图加载完成 - 请点击刷新按钮加载停车数据')
  })
}

// Load parking data from our backend API
const loadParkingData = async () => {
  if (!map || loading.value) return
  
  console.log('🔄 从后端API加载停车数据...')
  loading.value = true
  parkingCount.value = 0
  availableCount.value = 0
  occupiedCount.value = 0
  dataSource.value = '🔄 Loading from backend...'

  try {
    const startTime = Date.now()
    const response = await fetch(`${BACKEND_URL}/api/parking`)
    const duration = Date.now() - startTime
        
    if (!response.ok) {
      throw new Error(`后端API调用失败: ${response.status} ${response.statusText}`)
    }
        
    const result = await response.json()
    console.log(`✅ 后端API调用成功! 耗时: ${duration}ms`, result)

    if (!result.success) {
      throw new Error(result.error || '后端返回错误')
    }

    const parkingSpots = result.data || []
    console.log(`📊 获取到 ${parkingSpots.length} 个停车位`)

    // Convert backend data to GeoJSON format for MapBox
    const geoJsonFeatures = parkingSpots.map(spot => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(spot.longitude), parseFloat(spot.latitude)]
      },
      properties: {
        id: spot.id,
        name: spot.name || 'Unknown Parking Spot',
        status: spot.status || 'Available',
        street_name: spot.street_name || 'Unknown Street',
        zone_number: spot.zone_number,
        area: spot.area || 'Melbourne CBD',
        restrictions: typeof spot.restrictions === 'string' ? spot.restrictions : JSON.stringify(spot.restrictions || {}),
        cost: typeof spot.cost_info === 'string' ? spot.cost_info : 'Varies by location',
        sensor_id: spot.sensor_id,
        bay_id: spot.bay_id,
        last_updated: spot.last_updated
      }
    }))

    // Store for filtering
    allParkingSpots = geoJsonFeatures

    // Update counts
    parkingCount.value = geoJsonFeatures.length
    availableCount.value = geoJsonFeatures.filter(spot => spot.properties.status === 'Available').length
    occupiedCount.value = geoJsonFeatures.filter(spot => spot.properties.status === 'Occupied').length
    
    // Update data source info
    usingRealData.value = true
    const source = result.meta?.cached ? '💾 Cached Data' : '🌐 Fresh Data'
    dataSource.value = `${source} (${duration}ms)`

    console.log(`📊 数据统计: 可用 ${availableCount.value}, 占用 ${occupiedCount.value}`)

    // Remove existing layer if present
    if (map.getSource('parking-spots')) {
      map.removeLayer('parking-spots-layer')
      map.removeSource('parking-spots')
    }

    // Add parking data to map
    map.addSource('parking-spots', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: geoJsonFeatures
      }
    })

    map.addLayer({
      id: 'parking-spots-layer',
      type: 'circle',
      source: 'parking-spots',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'case',
          ['==', ['get', 'status'], 'Available'], '#28a745',
          ['==', ['get', 'status'], 'Occupied'], '#dc3545',
          '#28a745'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    // Add event listeners
    addMapEventListeners()

    console.log('✅ 停车数据加载完成!')

  } catch (error) {
    console.error('❌ 加载停车数据失败:', error)
    dataSource.value = `❌ Error: ${error.message}`
    
    // Show user-friendly error
    alert(`加载数据失败: ${error.message}\n\n请确保后端服务器运行在 ${BACKEND_URL}`)
  } finally {
    loading.value = false
  }
}

// Enhanced search function with marker and super zoom
const searchLocation = async () => {
  if (!searchQuery.value.trim() || searching.value) return
  
  searching.value = true
  
  try {
    const query = encodeURIComponent(searchQuery.value.trim())
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_CONFIG.accessToken}&proximity=144.9631,-37.8136&country=AU&bbox=144.5937,-38.4339,145.5125,-37.5113`
    
    console.log('🔍 搜索地址:', searchQuery.value)
    const response = await fetch(geocodingUrl)
    
    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }
    
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lng, lat] = feature.center
      
      console.log('✅ 找到位置:', feature.place_name, '坐标:', [lng, lat])
      
      // 移除旧的搜索标记
      if (searchMarker) {
        searchMarker.remove()
      }
      
      // 添加新的搜索位置标记 - 红色星形标记
      searchMarker = new mapboxgl.Marker({
        color: '#FF6B6B',
        scale: 1.2
      })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="search-popup">
                <h3>🎯 搜索位置</h3>
                <p><strong>${feature.place_name}</strong></p>
                <p>📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p><em>在300米范围内搜索停车位</em></p>
              </div>
            `)
        )
        .addTo(map)
      
      // 超级放大功能 - 根据地址类型智能缩放
      let zoomLevel = 18 // 默认超级放大
      
      // 根据地址的详细程度调整缩放级别
      const addressText = feature.place_name.toLowerCase()
      if (addressText.includes('street') || addressText.includes('road') || addressText.includes('avenue')) {
        zoomLevel = 19 // 街道级别 - 超级放大
      } else if (addressText.includes('suburb') || addressText.includes('vic')) {
        zoomLevel = 16 // 郊区级别
      } else if (feature.bbox) {
        // 如果有边界框，计算最适合的缩放级别
        const bbox = feature.bbox
        const latDiff = Math.abs(bbox[3] - bbox[1])
        const lngDiff = Math.abs(bbox[2] - bbox[0])
        const maxDiff = Math.max(latDiff, lngDiff)
        
        if (maxDiff > 0.1) zoomLevel = 13
        else if (maxDiff > 0.05) zoomLevel = 15
        else if (maxDiff > 0.01) zoomLevel = 17
        else zoomLevel = 19 // 非常具体的位置 - 超级放大
      }
      
      console.log(`🎯 超级放大到缩放级别 ${zoomLevel}`)
      
      // 飞行到搜索位置并超级放大
      map.flyTo({
        center: [lng, lat],
        zoom: zoomLevel,
        duration: 2500, // 稍微慢一点的动画让用户看清楚
        essential: true
      })
      
      // 过滤附近的停车位
      filterParkingByLocation(lng, lat, feature.place_name)
      
    } else {
      alert('Location not found. Please try a different search term.')
    }
  } catch (error) {
    console.error('Search failed:', error)
    alert('Search failed. Please try again.')
  } finally {
    searching.value = false
  }
}

// Filter parking spots by distance from searched location
const filterParkingByLocation = (lng, lat, locationName) => {
  const radiusKm = 0.3  // 🔄 改为300米半径
  
  console.log(`🎯 开始过滤: 搜索位置 [${lng}, ${lat}], 半径 ${radiusKm}km (${radiusKm * 1000}米)`)
  console.log(`📊 总停车位数量: ${allParkingSpots.length}`)
  
  // 更新过滤状态
  isFiltered.value = true
  searchLocationName.value = locationName
  
  const filteredSpots = allParkingSpots.filter((spot) => {
    const [spotLng, spotLat] = spot.geometry.coordinates
    const distance = calculateDistance(lat, lng, spotLat, spotLng)
    return distance <= radiusKm
  })
  
  console.log(`✅ 过滤结果: ${filteredSpots.length} 个停车位在 ${radiusKm}km 范围内`)
  
  // 简化的调试信息
  if (filteredSpots.length === 0) {
    console.log(`⚠️ 300米内没有停车位`)
  }
  
  updateParkingLayer(filteredSpots)
  parkingCount.value = filteredSpots.length
  
  const filteredStatusCounts = {}
  filteredSpots.forEach(spot => {
    const status = spot.properties.status
    filteredStatusCounts[status] = (filteredStatusCounts[status] || 0) + 1
  })
  availableCount.value = filteredStatusCounts['Available'] || 0
  occupiedCount.value = filteredStatusCounts['Occupied'] || 0
  
  console.log(`🔍 在 ${locationName} 300米范围内找到 ${filteredSpots.length} 个停车位`)
  console.log(`📊 可用: ${availableCount.value}, 占用: ${occupiedCount.value}`)
  
  // 🔧 重要修复：无论是否找到停车位，都要保持搜索位置的标记和放大效果
  // 不再使用 return 来提前退出
  if (filteredSpots.length === 0) {
    console.log('⚠️ 300米范围内没有找到停车位，但保持在搜索位置')
    // 只是显示提示，但不阻止后续的视图调整
    setTimeout(() => {
      alert(`在 ${locationName} 300米范围内没有找到停车位。地图已放大到搜索位置，你可以手动查看附近区域。`)
    }, 1000)
  }
  
  // 延迟调整视图 - 根据是否有停车位决定如何调整视图
  setTimeout(() => {
    if (filteredSpots.length > 0) {
      // 有停车位时：包含停车位和搜索位置
      const coordinates = filteredSpots.map(spot => spot.geometry.coordinates)
      coordinates.push([lng, lat]) // 包含搜索位置
      
      const lngs = coordinates.map(coord => coord[0])
      const lats = coordinates.map(coord => coord[1])
      
      const bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      ]
      
      // 如果所有点都很接近，保持高缩放级别
      const latRange = Math.max(...lats) - Math.min(...lats)
      const lngRange = Math.max(...lngs) - Math.min(...lngs)
      const maxRange = Math.max(latRange, lngRange)
      
      const padding = { top: 80, bottom: 80, left: 80, right: 80 }
      const maxZoom = maxRange < 0.01 ? 18 : 17
      
      map.fitBounds(bounds, {
        padding,
        maxZoom,
        duration: 2000
      })
    } else {
      // 没有停车位时：只保持在搜索位置的放大状态
      // 不做额外的视图调整，让 searchLocation 函数中的 map.flyTo 生效
      console.log('🎯 保持搜索位置的放大效果')
    }
  }, 3000) // 给 searchLocation 中的 flyTo 足够时间完成 (2500ms + 500ms buffer)
}

// Calculate distance between two points in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Update parking layer with new data
const updateParkingLayer = (spots) => {
  if (map.getSource('parking-spots')) {
    map.getSource('parking-spots').setData({
      type: 'FeatureCollection',
      features: spots
    })
  }
}

// Add map event listeners
const addMapEventListeners = () => {
  map.on('click', 'parking-spots-layer', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice()
    const properties = e.features[0].properties

    const statusColor = properties.status === 'Available' ? 'green' : 'red'
    
    const popupContent = `
      <div class="parking-popup">
        <h3>${properties.name}</h3>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${properties.status}</span></p>
        <p><strong>Street:</strong> ${properties.street_name}</p>
        <p><strong>Area:</strong> ${properties.area}</p>
        <p><strong>Zone:</strong> ${properties.zone_number || 'N/A'}</p>
        <p><strong>Restrictions:</strong> ${properties.restrictions}</p>
        ${properties.last_updated ? `<p><strong>Last Updated:</strong> ${properties.last_updated}</p>` : ''}
        <p><em>🚀 Data from Backend API</em></p>
      </div>
    `

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map)
  })

  map.on('mouseenter', 'parking-spots-layer', () => {
    map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', 'parking-spots-layer', () => {
    map.getCanvas().style.cursor = ''
  })
}

// Reset view to show all parking spots
const resetView = () => {
  // 移除搜索标记
  if (searchMarker) {
    searchMarker.remove()
    searchMarker = null
  }
  
  // 重置状态
  isFiltered.value = false
  searchLocationName.value = ''
  
  updateParkingLayer(allParkingSpots)
  parkingCount.value = allParkingSpots.length
  
  const allStatusCounts = {}
  allParkingSpots.forEach(spot => {
    const status = spot.properties.status
    allStatusCounts[status] = (allStatusCounts[status] || 0) + 1
  })
  availableCount.value = allStatusCounts['Available'] || 0
  occupiedCount.value = allStatusCounts['Occupied'] || 0
  
  searchQuery.value = ''
  
  if (allParkingSpots.length > 0) {
    const coordinates = allParkingSpots.map(spot => spot.geometry.coordinates)
    
    const lngs = coordinates.map(coord => coord[0])
    const lats = coordinates.map(coord => coord[1])
    
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ]
    
    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: 15,
      duration: 1500
    })
  } else {
    map.flyTo({
      center: MAPBOX_CONFIG.melbourne.center,
      zoom: MAPBOX_CONFIG.melbourne.zoom,
      duration: 1500
    })
  }
  
  console.log('🔄 视图已重置，显示所有停车位')
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.map-header {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-container {
  width: 100%;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #007cbf;
}

.search-btn, .reset-btn, .refresh-btn {
  background: #007cbf;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.reset-btn {
  background: #28a745;
}

.search-btn:hover:not(:disabled), .refresh-btn:hover:not(:disabled) {
  background: #005a8b;
}

.reset-btn:hover {
  background: #218838;
}

.search-btn:disabled, .refresh-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.map-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  flex-wrap: wrap;
}

.info {
  color: #666;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.data-source {
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid;
}

.data-source.real-data {
  background-color: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.data-source.mock-data {
  background-color: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.no-data {
  color: #6c757d;
  font-style: italic;
  font-size: 14px;
}

.filter-status {
  background-color: #e7f3ff;
  border: 1px solid #007cbf;
  color: #007cbf;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
}

.legend {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.legend-dot.available {
  background-color: #28a745;
}

.legend-dot.occupied {
  background-color: #dc3545;
}

.map {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007cbf;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

:deep(.mapboxgl-popup-content) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.parking-popup h3) {
  margin: 0 0 10px 0;
  color: #007cbf;
  font-size: 1.1rem;
}

:deep(.parking-popup p) {
  margin: 5px 0;
  font-size: 14px;
  line-height: 1.4;
}

:deep(.search-popup h3) {
  margin: 0 0 10px 0;
  color: #FF6B6B;
  font-size: 1.1rem;
}

:deep(.search-popup p) {
  margin: 5px 0;
  font-size: 14px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .map-header {
    padding: 10px;
    gap: 10px;
  }
  
  .map-header h2 {
    font-size: 1.2rem;
    text-align: center;
  }
  
  .search-box {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .search-btn, .reset-btn, .refresh-btn {
    width: 100%;
    padding: 12px;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .info {
    text-align: center;
  }
  
  .legend {
    justify-content: center;
  }
}
</style>
