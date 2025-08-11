import { calculateDistance } from '../utils/common.js'
import { TIMEOUTS, API_LIMITS, PARKING_STATUS, DEFAULTS } from '../constants/app.js'

// Memory cache object (simple version, Redis recommended for production)
let memoryCache = {
  data: null,
  timestamp: null,
  ttl: TIMEOUTS.CACHE_TTL
};

// Melbourne API configuration
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
    this.cacheTTL = TIMEOUTS.CACHE_TTL;
  }

  // Get parking spot data (prioritize from cache)
  async getParkingSpots(filters = {}, limit = API_LIMITS.DEFAULT_LIMIT, offset = API_LIMITS.DEFAULT_OFFSET) {
    try {
      console.log('📦 Checking memory cache...');
      
      // Check memory cache
      const now = Date.now();
      if (memoryCache.data && 
          memoryCache.timestamp && 
          (now - memoryCache.timestamp) < memoryCache.ttl) {
        
        console.log(`✅ Memory cache hit, data count: ${memoryCache.data.length}`);
        
        // Apply filters
        let filteredData = this.applyFilters(memoryCache.data, filters);
        
        // Pagination
        const total = filteredData.length;
        const spots = filteredData.slice(offset, offset + limit);
        
        return {
          spots,
          total,
          cached: true,
          lastUpdated: new Date(memoryCache.timestamp).toISOString()
        };
      }
      
      console.log('⚠️ Cache expired or no data, fetching from API...');
      
      // Fetch new data from API
      const freshData = await this.syncFromAPI();
      
      // Update cache
      memoryCache = {
        data: freshData,
        timestamp: now,
        ttl: this.cacheTTL
      };
      
      // Apply filters
      let filteredData = this.applyFilters(freshData, filters);
      
      // Pagination
      const total = filteredData.length;
      const spots = filteredData.slice(offset, offset + limit);
      
      return {
        spots,
        total,
        cached: false,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to get parking data:', error);
      
      // If there's old cache data, return old data instead of failing
      if (memoryCache.data && memoryCache.data.length > 0) {
        console.log('⚠️ Using expired cache data as fallback solution');
        
        let filteredData = this.applyFilters(memoryCache.data, filters);
        const total = filteredData.length;
        const spots = filteredData.slice(offset, offset + limit);
        
        return {
          spots,
          total,
          cached: true,
          lastUpdated: new Date(memoryCache.timestamp).toISOString(),
          warning: 'Using cached data, may not be the latest'
        };
      }
      
      throw error;
    }
  }

  // Sync data from Melbourne API
  async syncFromAPI() {
    console.log('🌐 Starting data sync from Melbourne API...');
    
    for (let i = 0; i < MELBOURNE_APIS.endpoints.length; i++) {
      const endpoint = MELBOURNE_APIS.endpoints[i];
      
      try {
        console.log(`📡 Trying API endpoint ${i + 1}/${MELBOURNE_APIS.endpoints.length}: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'Melbourne-Parking-App/1.0',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        });
        
        if (!response.ok) {
          console.warn(`⚠️ API endpoint ${i + 1} returned status: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ API endpoint ${i + 1} successfully retrieved data`);
        
        // Process different API response formats
        const processedData = this.processAPIResponse(data);
        
        if (processedData.length > 0) {
          console.log(`✅ Successfully processed ${processedData.length} parking data records`);
          return processedData;
        } else {
          console.warn(`⚠️ API endpoint ${i + 1} returned empty data`);
          continue;
        }
        
      } catch (error) {
        console.error(`❌ API endpoint ${i + 1} error:`, error.message);
        continue;
      }
    }
    
    throw new Error('All API endpoints failed');
  }

  // Process API response data
  processAPIResponse(data) {
    let spots = [];
    
    console.log('🔄 Processing API response data, detecting format...');
    
    try {
      // Format 1: Melbourne API v2 format (data.results)
      if (data.results && Array.isArray(data.results)) {
        console.log(`📋 Detected Melbourne API v2 format, record count: ${data.results.length}`);
        spots = data.results
          .filter(spot => this.hasValidLocation(spot))
          .map(spot => this.transformSpotData(spot));
      }
      // Format 2: GeoJSON format (data.features)
      else if (data.features && Array.isArray(data.features)) {
        console.log(`📋 Detected GeoJSON format, feature count: ${data.features.length}`);
        spots = data.features
          .filter(feature => this.hasValidLocation(feature))
          .map(feature => this.transformGeoJSONData(feature));
      }
      // Format 3: Direct array format
      else if (Array.isArray(data)) {
        console.log(`📋 Detected direct array format, record count: ${data.length}`);
        spots = data
          .filter(spot => this.hasValidLocation(spot))
          .map(spot => this.transformSpotData(spot));
      }
      // Format 4: Wrapped in result.records
      else if (data.result && data.result.records && Array.isArray(data.result.records)) {
        console.log(`📋 Detected wrapped format, record count: ${data.result.records.length}`);
        spots = data.result.records
          .filter(spot => this.hasValidLocation(spot))
          .map(spot => this.transformSpotData(spot));
      }
      else {
        console.warn('⚠️ Unrecognized API response format:', Object.keys(data));
        return [];
      }
      
      const validSpots = spots.filter(spot => spot && spot.latitude && spot.longitude);
      console.log(`✅ Successfully converted ${validSpots.length} valid parking spots (before filtering: ${spots.length})`);
      
      return validSpots;
      
    } catch (error) {
      console.error('❌ Error processing API response data:', error);
      return [];
    }
  }

  // Check if has valid location information
  hasValidLocation(item) {
    const record = item.record || item.properties || item;
    
    // Check various possible location field formats
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

  // Transform parking spot data (API v2 format)
  transformSpotData(spot) {
    const record = spot.record || spot;
    
    // Extract location information
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
      lat = record.geopoint2d[0];  // Melbourne format: [lat, lon]
      lng = record.geopoint2d[1];
    }
    
    // Determine status
    let status = PARKING_STATUS.AVAILABLE;
    if (record.status_description === PARKING_STATUS.PRESENT || record.status === PARKING_STATUS.PRESENT) {
      status = PARKING_STATUS.OCCUPIED;
    } else if (record.status_description === PARKING_STATUS.UNOCCUPIED || record.status === PARKING_STATUS.UNOCCUPIED) {
      status = PARKING_STATUS.AVAILABLE;
    }
    
    return {
      id: record.sensor_id || record.kerbsideid || record.bay_id || `spot_${Math.random().toString(36).substr(2, 9)}`,
      external_id: record.sensor_id || record.kerbsideid || record.bay_id,
      name: record.street_name || `Parking Lot ${record.zone_number || record.bay_id || 'Unknown'}`,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      street_name: record.street_name || `Parking Lot ${record.zone_number || record.bay_id || 'Unknown'}`,
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

  // Transform GeoJSON data
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
      name: props.street_name || `Parking Lot ${props.bay_id || 'Unknown'}`,
      latitude: parseFloat(coords[1]), // GeoJSON format: [lng, lat]
      longitude: parseFloat(coords[0]),
      street_name: props.street_name || `Parking Lot ${props.bay_id || 'Unknown'}`,
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

  // Apply filters
  applyFilters(data, filters) {
    let filtered = [...data];
    
    // Status filtering
    if (filters.status) {
      filtered = filtered.filter(spot => 
        spot.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Geographic location filtering
    if (filters.location) {
      const { lat, lng, radius } = filters.location;
      filtered = filtered.filter(spot => {
        const distance = calculateDistance(
          lat, lng, 
          spot.latitude, spot.longitude
        );
        return distance <= radius;
      });
    }
    
    return filtered;
  }

  // Distance calculation functions moved to utils/common.js

  // Force refresh data
  async forceRefreshData() {
    console.log('🔄 Force refreshing parking data...');
    
    // Clear cache
    memoryCache = {
      data: null,
      timestamp: null,
      ttl: this.cacheTTL
    };
    
    // Sync from API
    const freshData = await this.syncFromAPI();
    
    // Update cache
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

  // Get statistics data
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

  // Search parking spots
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

  // Get single parking spot details
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

// Create service instance
const parkingService = new ParkingService();

// Export convenience functions
export const getAllParkingSpots = (filters, limit, offset) => parkingService.getParkingSpots(filters, limit, offset);
export const forceRefreshData = () => parkingService.forceRefreshData();
export const searchParkingSpots = (searchTerm, limit) => parkingService.searchParkingSpots(searchTerm, limit);
export const getParkingSpotById = (id) => parkingService.getParkingSpotById(id);
