<template>
  <div class="map-container" style="position: relative; z-index: 1;">
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
      
      <!-- 停车类型选择按钮 -->
      <div class="parking-type-controls">
        <button 
          @click="setParkingTypeFilter('all')" 
          :class="{ active: parkingTypeFilter === 'all' }" 
          class="type-btn"
        >
          All Types
        </button>
        <button 
          @click="setParkingTypeFilter('street')" 
          :class="{ active: parkingTypeFilter === 'street' }" 
          class="type-btn"
        >
          Street Parking
        </button>
        <button 
          @click="setParkingTypeFilter('building')" 
          :class="{ active: parkingTypeFilter === 'building' }" 
          class="type-btn"
        >
          Building Parking
        </button>
      </div>
      
      <div class="controls">
        <div class="info">
          <div class="data-status">
            <span v-if="parkingCount > 0">📍 Total: {{ parkingCount }} | 🟢 Available: {{ availableCount }} | 🔴 Occupied: {{ occupiedCount }}</span>
            <span v-if="isFiltered" class="filter-status">🔍 Showing parking spots within 300m of {{ searchLocationName }}</span>
            <span v-if="parkingCount === 0 && !loading" class="no-data">🔄 Click "Refresh Data" to load parking information</span>
            <span v-if="parkingCount > 0" class="data-source" :class="{ 'real-data': usingRealData, 'mock-data': !usingRealData }">
              {{ dataSource }}
            </span>
          </div>
          <div class="legend">
            <span class="legend-item" v-if="parkingTypeFilter === 'all' || parkingTypeFilter === 'street'">
              <span class="legend-dot available"></span>Available/Free
            </span>
            <span class="legend-item" v-if="parkingTypeFilter === 'all' || parkingTypeFilter === 'street'">
              <span class="legend-dot occupied"></span>Occupied
            </span>
            <span class="legend-item" v-if="parkingTypeFilter === 'all' || parkingTypeFilter === 'building'">
              <span class="legend-dot building"></span>Building Parking
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

// 建筑物停车场数据
let buildingParkingData = null

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
const isFiltered = ref(false) // Added: whether in filtered state
const searchLocationName = ref('') // Renamed to avoid conflicts
const parkingTypeFilter = ref('all') // 停车类型过滤器：'all', 'street', 'building'

// Backend API configuration - dynamically obtained
const BACKEND_URL = BACKEND_CONFIG.baseURL

console.log('🌐 Connecting to backend:', BACKEND_URL)

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

const loadBuildingParkingData = async () => {
  try {
    const response = await fetch('/data/building-parking.json')
    buildingParkingData = await response.json()
    addBuildingParkingLayer()
  } catch (error) {
    console.error('Error loading building parking data:', error)
  }
}

const addBuildingParkingLayer = () => {
  if (!map || !buildingParkingData) return

  // 如果图层已存在，先移除
  if (map.getLayer('building-parking-points')) {
    map.removeLayer('building-parking-points')
  }
  if (map.getSource('building-parking')) {
    map.removeSource('building-parking')
  }

  // 添加数据源
  map.addSource('building-parking', {
    type: 'geojson',
    data: buildingParkingData
  })

  // 添加图层
  map.addLayer({
    id: 'building-parking-points',
    type: 'circle',
    source: 'building-parking',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'parking_spaces'],
        0, 5,
        100, 10,
        500, 15
      ],
      'circle-color': '#4264fb',
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  })

  // 添加点击事件
  map.on('click', 'building-parking-points', (e) => {
    if (!e.features.length) return

    const feature = e.features[0]
    const coordinates = feature.geometry.coordinates.slice()
    const properties = feature.properties

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`
        <h3>Building Parking Details</h3>
        <p><strong>Address:</strong> ${properties.building_address}</p>
        <p><strong>Parking Type:</strong> ${properties.parking_type}</p>
        <p><strong>Parking Spaces:</strong> ${properties.parking_spaces}</p>
      `)
      .addTo(map)
  })

  // 鼠标悬停效果
  map.on('mouseenter', 'building-parking-points', () => {
    map.getCanvas().style.cursor = 'pointer'
  })

  map.on('mouseleave', 'building-parking-points', () => {
    map.getCanvas().style.cursor = ''
  })
}

const initializeMap = () => {
  mapboxgl.accessToken = MAPBOX_CONFIG.accessToken

  map = new mapboxgl.Map({
    container: 'map',
    style: MAPBOX_CONFIG.styles.streets,
    center: MAPBOX_CONFIG.melbourne.center,
    zoom: MAPBOX_CONFIG.melbourne.zoom
  });

  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.FullscreenControl())

  map.on('load', () => {
    console.log('Map loaded')
    loadParkingData()
    loadBuildingParkingData()
  })

}
// Load parking data from our backend API
const loadParkingData = async () => {
  if (!map || loading.value) return

  console.log('🔄 Loading parking data from backend API...')
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
      throw new Error(`Backend API call failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log(`✅ Backend API call successful! Duration: ${duration}ms`, result)

    if (!result.success) {
      throw new Error(result.error || 'Backend returned error')
    }

    const parkingSpots = result.data || []
    console.log(`📊 Retrieved ${parkingSpots.length} parking spots`)

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

    console.log(`📊 Data statistics: Available ${availableCount.value}, Occupied ${occupiedCount.value}`)

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

    console.log('✅ Parking data loading completed!')

  } catch (error) {
    console.error('❌ Failed to load parking data:', error)
    dataSource.value = `❌ Error: ${error.message}`

    // Show user-friendly error
    alert(`Failed to load data: ${error.message}\n\nPlease ensure backend server is running at ${BACKEND_URL}`)
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

    console.log('🔍 Searching address:', searchQuery.value)
    const response = await fetch(geocodingUrl)

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lng, lat] = feature.center

      console.log('✅ Location found:', feature.place_name, 'Coordinates:', [lng, lat])

      // Remove old search marker
      if (searchMarker) {
        searchMarker.remove()
      }

      // Add new search location marker - red star marker
      searchMarker = new mapboxgl.Marker({
        color: '#FF6B6B',
        scale: 1.2
      })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="search-popup">
                <h3>🎯 Search Location</h3>
                <p><strong>${feature.place_name}</strong></p>
                <p>📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p><em>Searching for parking spots within 300m</em></p>
              </div>
            `)
        )
        .addTo(map)

      // Super zoom function - intelligent zoom based on address type
      let zoomLevel = 18 // Default super zoom

      // Adjust zoom level based on address detail level
      const addressText = feature.place_name.toLowerCase()
      if (addressText.includes('street') || addressText.includes('road') || addressText.includes('avenue')) {
        zoomLevel = 19 // Street level - super zoom
      } else if (addressText.includes('suburb') || addressText.includes('vic')) {
        zoomLevel = 16 // Suburb level
      } else if (feature.bbox) {
        // If there's a bounding box, calculate the most suitable zoom level
        const bbox = feature.bbox
        const latDiff = Math.abs(bbox[3] - bbox[1])
        const lngDiff = Math.abs(bbox[2] - bbox[0])
        const maxDiff = Math.max(latDiff, lngDiff)

        if (maxDiff > 0.1) zoomLevel = 13
        else if (maxDiff > 0.05) zoomLevel = 15
        else if (maxDiff > 0.01) zoomLevel = 17
        else zoomLevel = 19 // Very specific location - super zoom
      }

      console.log(`🎯 Super zoom to zoom level ${zoomLevel}`)

      // Fly to search location and super zoom
      map.flyTo({
        center: [lng, lat],
        zoom: zoomLevel,
        duration: 2500, // Slightly slower animation to let users see clearly
        essential: true
      })

      // Filter nearby parking spots
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
  const radiusKm = 0.3  // 🔄 Changed to 300m radius

  console.log(`🎯 Starting filter: Search location [${lng}, ${lat}], radius ${radiusKm}km (${radiusKm * 1000}m)`)
  console.log(`📊 Total parking spots: ${allParkingSpots.length}`)

  // Update filter state
  isFiltered.value = true
  searchLocationName.value = locationName

  const filteredSpots = allParkingSpots.filter((spot) => {
    const [spotLng, spotLat] = spot.geometry.coordinates
    const distance = calculateDistance(lat, lng, spotLat, spotLng)
    return distance <= radiusKm
  })

  console.log(`✅ Filter result: ${filteredSpots.length} parking spots within ${radiusKm}km range`)

  // Simplified debug info
  if (filteredSpots.length === 0) {
    console.log(`⚠️ No parking spots within 300m`)
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

  console.log(`🔍 Found ${filteredSpots.length} parking spots within 300m of ${locationName}`)
  console.log(`📊 Available: ${availableCount.value}, Occupied: ${occupiedCount.value}`)

  // 🔧 Important fix: maintain search location marker and zoom effect regardless of whether parking spots are found
  // No longer use return to exit early
  if (filteredSpots.length === 0) {
    console.log('⚠️ No parking spots found within 300m, but staying at search location')
    // Just show prompt, but don't prevent subsequent view adjustments
    setTimeout(() => {
      alert(`No parking spots found within 300m of ${locationName}. Map has been zoomed to search location, you can manually check nearby areas.`)
    }, 1000)
  }

  // Delayed view adjustment - decide how to adjust view based on whether there are parking spots
  setTimeout(() => {
    if (filteredSpots.length > 0) {
      // When there are parking spots: include parking spots and search location
      const coordinates = filteredSpots.map(spot => spot.geometry.coordinates)
      coordinates.push([lng, lat]) // 包含搜索位置

      const lngs = coordinates.map(coord => coord[0])
      const lats = coordinates.map(coord => coord[1])

      const bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      ]

      // If all points are close, maintain high zoom level
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
      // When there are no parking spots: only maintain zoom state at search location
      // Don't make additional view adjustments, let map.flyTo in searchLocation function take effect
      console.log('🎯 Maintaining zoom effect at search location')
    }
  }, 3000) // Give enough time for flyTo in searchLocation to complete (2500ms + 500ms buffer)
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
  // Remove search marker
  if (searchMarker) {
    searchMarker.remove()
    searchMarker = null
  }

  // Reset state
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

  console.log('🔄 View has been reset, showing all parking spots')
}

// 设置停车类型过滤器
const setParkingTypeFilter = (type) => {
  parkingTypeFilter.value = type
  updateParkingLayerVisibility()
  console.log(`🎯 Parking type filter set to: ${type}`)
}

// 更新停车层可见性
const updateParkingLayerVisibility = () => {
  if (!map) return
  
  const showStreet = parkingTypeFilter.value === 'all' || parkingTypeFilter.value === 'street'
  const showBuilding = parkingTypeFilter.value === 'all' || parkingTypeFilter.value === 'building'
  
  // 更新街道停车层可见性
  if (map.getLayer('parking-spots-layer')) {
    map.setLayoutProperty('parking-spots-layer', 'visibility', showStreet ? 'visible' : 'none')
  }
  
  // 更新建筑物停车层可见性
  if (map.getLayer('building-parking-points')) {
    map.setLayoutProperty('building-parking-points', 'visibility', showBuilding ? 'visible' : 'none')
  }
  
  // 更新统计数据
  updateParkingCounts()
}

// 更新停车统计数据
const updateParkingCounts = () => {
  let totalCount = 0
  let availableCount = 0
  let occupiedCount = 0
  
  if (parkingTypeFilter.value === 'all' || parkingTypeFilter.value === 'street') {
    allParkingSpots.forEach(spot => {
      totalCount++
      const status = spot.properties.status
      if (status === 'Available') {
        availableCount++
      } else if (status === 'Occupied') {
        occupiedCount++
      }
    })
  }
  
  if (parkingTypeFilter.value === 'all' || parkingTypeFilter.value === 'building') {
    if (buildingParkingData && buildingParkingData.features) {
      buildingParkingData.features.forEach(spot => {
        totalCount++
        // 建筑物停车位默认为可用
        availableCount++
      })
    }
  }
  
  parkingCount.value = totalCount
  availableCount.value = availableCount
  occupiedCount.value = occupiedCount
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

/* 停车类型选择按钮样式 */
.parking-type-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.type-btn {
  background: #f8f9fa;
  color: #495057;
  border: 2px solid #dee2e6;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.type-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.type-btn.active {
  background: #007cbf;
  color: white;
  border-color: #007cbf;
}

.type-btn.active:hover {
  background: #005a8b;
  border-color: #005a8b;
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
