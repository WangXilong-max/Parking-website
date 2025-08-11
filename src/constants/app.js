/**
 * Application Constants
 * Centralized place for all magic numbers and configuration values
 */

// Geographic Constants
export const MELBOURNE_COORDINATES = {
  DEFAULT_LAT: -37.8136,
  DEFAULT_LNG: 144.9631
}

export const GEOCODING_BOUNDS = {
  BBOX: '144.5,-38.5,145.5,-37.5',
  COUNTRY: 'AU'
}

// Distance and Radius Constants (in meters)
export const DISTANCE = {
  SEARCH_RADIUS: 300,
  DATA_FETCH_RADIUS: 1000,
  EARTH_RADIUS_KM: 6371
}

// Time Constants (in milliseconds)
export const TIMEOUTS = {
  API_TIMEOUT: 30000,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAP_ANIMATION_DELAY: 500,
  MAP_FLY_DURATION: 2000,
  POPUP_DELAY: 2100
}

// Zoom Levels
export const MAP_ZOOM = {
  DEFAULT: 12,
  STREET_LEVEL: 19,
  SUBURB_LEVEL: 16,
  CITY_LEVEL: 13,
  DETAIL_LEVEL: 17,
  MAX_SEARCH_ZOOM: 18,
  RESET_MAX_ZOOM: 15
}

// Parking Restriction Order (for sorting by value)
export const RESTRICTION_ORDER = {
  '4P': 1,      // 4 hour parking - best value
  'MP4P': 2,    // 4 hour parking
  '2P': 3,      // 2 hour parking
  'MP2P': 4,    // 2 hour parking
  'MP3P': 5,    // 3 hour parking
  '1P': 6,      // 1 hour parking
  'MP1P': 7,    // 1 hour parking
  'LZ30': 8,    // 30 minute parking
  'QP': 9,      // Quick parking
  'SP': 10,     // Special parking
  'PP': 11      // Paid parking
}

// API Limits
export const API_LIMITS = {
  DEFAULT_PARKING_LIMIT: 10000, // 增加到10000，确保显示所有停车位
  DEFAULT_SEARCH_LIMIT: 50,
  RATE_LIMIT_REQUESTS: 1000,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000 // 15 minutes
}

// Circle Sizes for Map
export const MAP_CIRCLE_SIZES = {
  PARKING_SPOT: 8,
  SELECTED_SPOT: 12,
  BUILDING_MIN: 5,
  BUILDING_MAX: 15,
  BUILDING_SCALE_100: 10
}

// Padding for Map Bounds
export const MAP_PADDING = {
  top: 80,
  bottom: 80,
  left: 80,
  right: 80
}
