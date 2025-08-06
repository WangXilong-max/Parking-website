// 内存缓存对象 (简单版本，生产环境建议使用Redis)
let memoryCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5分钟TTL
};

// 墨尔本API配置
const MELBOURNE_APIS = {
  endpoints: [
    'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?limit=10000&timezone=Australia%2FMelbourne&select=*',
    'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/json?timezone=Australia%2FMelbourne',
    'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/geojson?timezone=Australia%2FMelbourne'
  ]
};

export class ParkingService {
  constructor() {
    this.cacheKey = 'parking:spots:all';
    this.cacheTTL = 5 * 60 * 1000; // 5分钟缓存
  }

  // 获取停车位数据 (优先从缓存)
  async getParkingSpots(filters = {}, limit = 1000, offset = 0) {
    try {
      console.log('📦 检查内存缓存...');
      
      // 检查内存缓存
      const now = Date.now();
      if (memoryCache.data && 
          memoryCache.timestamp && 
          (now - memoryCache.timestamp) < memoryCache.ttl) {
        
        console.log(`✅ 命中内存缓存，数据量: ${memoryCache.data.length}`);
        
        // 应用过滤器
        let filteredData = this.applyFilters(memoryCache.data, filters);
        
        // 分页
        const total = filteredData.length;
        const spots = filteredData.slice(offset, offset + limit);
        
        return {
          spots,
          total,
          cached: true,
          lastUpdated: new Date(memoryCache.timestamp).toISOString()
        };
      }
      
      console.log('⚠️ 缓存过期或无数据，从API获取...');
      
      // 从API获取新数据
      const freshData = await this.syncFromAPI();
      
      // 更新缓存
      memoryCache = {
        data: freshData,
        timestamp: now,
        ttl: this.cacheTTL
      };
      
      // 应用过滤器
      let filteredData = this.applyFilters(freshData, filters);
      
      // 分页
      const total = filteredData.length;
      const spots = filteredData.slice(offset, offset + limit);
      
      return {
        spots,
        total,
        cached: false,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ 获取停车数据失败:', error);
      
      // 如果有旧缓存数据，返回旧数据而不是失败
      if (memoryCache.data && memoryCache.data.length > 0) {
        console.log('⚠️ 使用过期缓存数据作为降级方案');
        
        let filteredData = this.applyFilters(memoryCache.data, filters);
        const total = filteredData.length;
        const spots = filteredData.slice(offset, offset + limit);
        
        return {
          spots,
          total,
          cached: true,
          lastUpdated: new Date(memoryCache.timestamp).toISOString(),
          warning: '使用缓存数据，可能不是最新的'
        };
      }
      
      throw error;
    }
  }

  // 从墨尔本API同步数据
  async syncFromAPI() {
    console.log('🌐 开始从墨尔本API同步数据...');
    
    for (let i = 0; i < MELBOURNE_APIS.endpoints.length; i++) {
      const endpoint = MELBOURNE_APIS.endpoints[i];
      
      try {
        console.log(`📡 尝试API端点 ${i + 1}/${MELBOURNE_APIS.endpoints.length}: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'Melbourne-Parking-App/1.0',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30秒超时
        });
        
        if (!response.ok) {
          console.warn(`⚠️ API端点 ${i + 1} 返回状态: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ API端点 ${i + 1} 成功获取数据`);
        
        // 处理不同的API响应格式
        const processedData = this.processAPIResponse(data);
        
        if (processedData.length > 0) {
          console.log(`✅ 成功处理 ${processedData.length} 条停车数据`);
          return processedData;
        } else {
          console.warn(`⚠️ API端点 ${i + 1} 返回空数据`);
          continue;
        }
        
      } catch (error) {
        console.error(`❌ API端点 ${i + 1} 错误:`, error.message);
        continue;
      }
    }
    
    throw new Error('所有API端点都失败了');
  }

  // 处理API响应数据
  processAPIResponse(data) {
    let spots = [];
    
    console.log('🔄 处理API响应数据，格式检测中...');
    
    try {
      // 格式1: Melbourne API v2 格式 (data.results)
      if (data.results && Array.isArray(data.results)) {
        console.log(`📋 检测到 Melbourne API v2 格式，记录数: ${data.results.length}`);
        spots = data.results
          .filter(spot => this.hasValidLocation(spot))
          .map(spot => this.transformSpotData(spot));
      }
      // 格式2: GeoJSON 格式 (data.features)
      else if (data.features && Array.isArray(data.features)) {
        console.log(`📋 检测到 GeoJSON 格式，特征数: ${data.features.length}`);
        spots = data.features
          .filter(feature => this.hasValidLocation(feature))
          .map(feature => this.transformGeoJSONData(feature));
      }
      // 格式3: 直接数组格式
      else if (Array.isArray(data)) {
        console.log(`📋 检测到直接数组格式，记录数: ${data.length}`);
        spots = data
          .filter(spot => this.hasValidLocation(spot))
          .map(spot => this.transformSpotData(spot));
      }
      // 格式4: 包装在result.records中
      else if (data.result && data.result.records && Array.isArray(data.result.records)) {
        console.log(`📋 检测到包装格式，记录数: ${data.result.records.length}`);
        spots = data.result.records
          .filter(spot => this.hasValidLocation(spot))
          .map(spot => this.transformSpotData(spot));
      }
      else {
        console.warn('⚠️ 未识别的API响应格式:', Object.keys(data));
        return [];
      }
      
      const validSpots = spots.filter(spot => spot && spot.latitude && spot.longitude);
      console.log(`✅ 成功转换 ${validSpots.length} 个有效停车位 (过滤前: ${spots.length})`);
      
      return validSpots;
      
    } catch (error) {
      console.error('❌ 处理API响应数据时出错:', error);
      return [];
    }
  }

  // 检查是否有有效位置信息
  hasValidLocation(item) {
    const record = item.record || item.properties || item;
    
    // 检查各种可能的位置字段格式
    const hasLocationObject = record.location && 
                             record.location.lat && 
                             record.location.lon;
    
    const hasLatLng = record.latitude && record.longitude;
    const hasLatLon = record.lat && record.lon;
    const hasGeopoint = record.geopoint2d && 
                       Array.isArray(record.geopoint2d) && 
                       record.geopoint2d.length >= 2;
    
    return hasLocationObject || hasLatLng || hasLatLon || hasGeopoint;
  }

  // 转换停车位数据 (API v2格式)
  transformSpotData(spot) {
    const record = spot.record || spot;
    
    // 提取位置信息
    let lat, lng;
    if (record.location && record.location.lat && record.location.lon) {
      lat = record.location.lat;
      lng = record.location.lon;
    } else if (record.latitude && record.longitude) {
      lat = record.latitude;
      lng = record.longitude;
    } else if (record.lat && record.lon) {
      lat = record.lat;
      lng = record.lon;
    } else if (record.geopoint2d && Array.isArray(record.geopoint2d)) {
      lat = record.geopoint2d[0];  // Melbourne格式: [lat, lon]
      lng = record.geopoint2d[1];
    }
    
    // 确定状态
    let status = 'Available';
    if (record.status_description === 'Present' || record.status === 'Present') {
      status = 'Occupied';
    } else if (record.status_description === 'Unoccupied' || record.status === 'Unoccupied') {
      status = 'Available';
    }
    
    return {
      id: record.sensor_id || record.kerbsideid || record.bay_id || `spot_${Math.random().toString(36).substr(2, 9)}`,
      external_id: record.sensor_id || record.kerbsideid || record.bay_id,
      name: record.street_name || `停车位 ${record.zone_number || record.bay_id || 'Unknown'}`,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      street_name: record.street_name || 'Unknown Street',
      zone_number: record.zone_number,
      status: status,
      parking_type: 'On-street',
      capacity: 1,
      restrictions: {
        type: record.restriction_type || 'No restriction',
        start: record.restriction_start_time,
        end: record.restriction_end_time,
        length: record.restriction_length
      },
      cost_info: {
        type: 'Hourly',
        rate: 'Varies by location'
      },
      last_updated: record.lastupdated || new Date().toISOString(),
      sensor_id: record.sensor_id,
      bay_id: record.bay_id || record.kerbsideid,
      area: record.street_name || record.between_street1 || 'Melbourne CBD'
    };
  }

  // 转换GeoJSON数据
  transformGeoJSONData(feature) {
    const props = feature.properties || {};
    const coords = feature.geometry.coordinates;
    
    let status = 'Available';
    if (props.status_description === 'Present' || props.status === 'Present') {
      status = 'Occupied';
    }
    
    return {
      id: props.sensor_id || props.bay_id || `geojson_${Math.random().toString(36).substr(2, 9)}`,
      external_id: props.sensor_id || props.bay_id,
      name: props.street_name || `停车位 ${props.bay_id || 'Unknown'}`,
      latitude: parseFloat(coords[1]), // GeoJSON格式: [lng, lat]
      longitude: parseFloat(coords[0]),
      street_name: props.street_name || 'Unknown Street',
      zone_number: props.zone_number,
      status: status,
      parking_type: 'On-street',
      capacity: 1,
      restrictions: props.restrictions || {},
      cost_info: {
        type: 'Hourly',
        rate: 'Varies by location'
      },
      last_updated: props.lastupdated || new Date().toISOString(),
      sensor_id: props.sensor_id,
      bay_id: props.bay_id,
      area: props.street_name || 'Melbourne CBD'
    };
  }

  // 应用过滤器
  applyFilters(data, filters) {
    let filtered = [...data];
    
    // 状态过滤
    if (filters.status) {
      filtered = filtered.filter(spot => 
        spot.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // 地理位置过滤
    if (filters.location) {
      const { lat, lng, radius } = filters.location;
      filtered = filtered.filter(spot => {
        const distance = this.calculateDistance(
          lat, lng, 
          spot.latitude, spot.longitude
        );
        return distance <= radius;
      });
    }
    
    return filtered;
  }

  // 计算两点间距离 (公里)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径(公里)
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // 强制刷新数据
  async forceRefreshData() {
    console.log('🔄 强制刷新停车数据...');
    
    // 清除缓存
    memoryCache = {
      data: null,
      timestamp: null,
      ttl: this.cacheTTL
    };
    
    // 从API同步
    const freshData = await this.syncFromAPI();
    
    // 更新缓存
    memoryCache = {
      data: freshData,
      timestamp: Date.now(),
      ttl: this.cacheTTL
    };
    
    return { 
      updated: freshData.length, 
      total: freshData.length 
    };
  }

  // 获取统计数据
  async getParkingStats() {
    const data = memoryCache.data || [];
    
    const total = data.length;
    const available = data.filter(spot => spot.status === 'Available').length;
    const occupied = data.filter(spot => spot.status === 'Occupied').length;
    
    return {
      total,
      available,
      occupied,
      availability_rate: total > 0 ? (available / total * 100).toFixed(1) : 0,
      last_updated: memoryCache.timestamp ? new Date(memoryCache.timestamp).toISOString() : null
    };
  }

  // 搜索停车位
  async searchParkingSpots(query, limit = 50) {
    const data = memoryCache.data || [];
    
    const searchTerm = query.toLowerCase();
    const results = data.filter(spot => 
      spot.name.toLowerCase().includes(searchTerm) ||
      spot.street_name.toLowerCase().includes(searchTerm) ||
      spot.area.toLowerCase().includes(searchTerm)
    ).slice(0, limit);
    
    return results;
  }

  // 获取单个停车位详情
  async getParkingSpotById(id) {
    const data = memoryCache.data || [];
    return data.find(spot => 
      spot.id === id || 
      spot.external_id === id ||
      spot.sensor_id === id ||
      spot.bay_id === id
    );
  }
}
