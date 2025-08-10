/**
 * Backend Application Constants
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

// Distance Constants
export const DISTANCE = {
  EARTH_RADIUS_KM: 6371,
  DEFAULT_SEARCH_RADIUS: 300 // meters
}

// Time Constants (in milliseconds)
export const TIMEOUTS = {
  API_TIMEOUT: 30000, // 30 seconds
  CACHE_TTL: 5 * 60 * 1000 // 5 minutes
}

// API Configuration
export const API_LIMITS = {
  DEFAULT_LIMIT: 1000,
  DEFAULT_OFFSET: 0,
  SEARCH_LIMIT: 50,
  RATE_LIMIT_REQUESTS: 1000,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000 // 15 minutes
}

// Parking Status
export const PARKING_STATUS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  PRESENT: 'Present',
  UNOCCUPIED: 'Unoccupied'
}

// Parking Types
export const PARKING_TYPES = {
  ON_STREET: 'On-street',
  OFF_STREET: 'Off-street',
  BUILDING: 'Building'
}

// Default Values
export const DEFAULTS = {
  PARKING_CAPACITY: 1,
  AREA: 'Melbourne CBD',
  COST_TYPE: 'Hourly',
  COST_RATE: 'Varies by location',
  RESTRICTION_TYPE: 'No restriction',
  UNKNOWN_STREET: 'Unknown Street',
  UNKNOWN_LOCATION: 'Unknown Location',
  UNKNOWN_PARKING_SPOT: 'Unknown Parking Spot'
}

// Parking Cost Rates (AUD)
export const PARKING_RATES = {
  '1P': 2.50,
  '2P': 2.00,
  '4P': 1.50,
  'MP2P': 1.75,
  DEFAULT: 3.00
}

// Parking Cost Maximums (AUD)
export const PARKING_MAX_COSTS = {
  '2P': 4.00,
  '4P': 6.00,
  'MP2P': 3.50
}

// Sample sizes for debugging
export const DEBUG_SAMPLE_SIZE = 10

// Random ID generation
export const ID_GENERATION = {
  RANDOM_STRING_LENGTH: 9,
  BASE: 36
}
