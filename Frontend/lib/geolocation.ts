import { Coordinates } from '@/types'

// ==================== HAVERSINE FORMULA ====================
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// ==================== GEOLOCATION API ====================
export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export interface GeolocationResult {
  coordinates: Coordinates
  timestamp: number
}

export interface GeolocationError {
  code: number
  message: string
}

/**
 * Get current position using browser Geolocation API
 */
export function getCurrentPosition(
  options: GeolocationOptions = {}
): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      })
      return
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          timestamp: position.timestamp,
        })
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
        })
      },
      defaultOptions
    )
  })
}

/**
 * Watch position changes
 */
export function watchPosition(
  callback: (result: GeolocationResult) => void,
  errorCallback: (error: GeolocationError) => void,
  options: GeolocationOptions = {}
): number | null {
  if (!navigator.geolocation) {
    errorCallback({
      code: 0,
      message: 'Geolocation is not supported by this browser',
    })
    return null
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
        timestamp: position.timestamp,
      })
    },
    (error) => {
      errorCallback({
        code: error.code,
        message: getGeolocationErrorMessage(error.code),
      })
    },
    defaultOptions
  )
}

/**
 * Clear position watch
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Get human-readable error message
 */
export function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 0:
      return 'Geolocation is not supported'
    case 1:
      return 'Permission denied. Please enable location services.'
    case 2:
      return 'Position unavailable. Please check your connection.'
    case 3:
      return 'Request timeout. Please try again.'
    default:
      return 'An unknown error occurred'
  }
}

// ==================== PERMISSION CHECKING ====================
/**
 * Check geolocation permission status
 */
export async function checkPermission(): Promise<PermissionState> {
  if (!navigator.permissions) {
    return 'prompt'
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch (error) {
    return 'prompt'
  }
}

/**
 * Request geolocation permission
 */
export async function requestPermission(): Promise<boolean> {
  try {
    const result = await getCurrentPosition()
    return true
  } catch (error) {
    return false
  }
}

// ==================== GEOFENCE CHECKING ====================
/**
 * Check if coordinates are within geofence
 */
export function isWithinGeofence(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon)
  return distance <= radiusMeters
}

/**
 * Get geofence status with details
 */
export interface GeofenceStatus {
  isInside: boolean
  distance: number
  radius: number
  percentage: number
}

export function getGeofenceStatus(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): GeofenceStatus {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon)
  const isInside = distance <= radiusMeters
  const percentage = Math.min((distance / radiusMeters) * 100, 100)

  return {
    isInside,
    distance,
    radius: radiusMeters,
    percentage,
  }
}

// ==================== COORDINATE VALIDATION ====================
/**
 * Validate latitude
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && lat >= -90 && lat <= 90
}

/**
 * Validate longitude
 */
export function isValidLongitude(lon: number): boolean {
  return typeof lon === 'number' && lon >= -180 && lon <= 180
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    isValidLatitude(coordinates.latitude) &&
    isValidLongitude(coordinates.longitude)
  )
}

// ==================== FORMATTING ====================
/**
 * Format coordinates for display
 */
export function formatCoordinates(coordinates: Coordinates): string {
  const lat = coordinates.latitude.toFixed(6)
  const lon = coordinates.longitude.toFixed(6)
  return `${lat}, ${lon}`
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// ==================== MOCK LOCATION (FOR DEVELOPMENT) ====================
/**
 * Generate random coordinates near a point (for testing)
 */
export function generateNearbyCoordinates(
  lat: number,
  lon: number,
  radiusMeters: number = 100
): Coordinates {
  // Generate random angle
  const angle = Math.random() * 2 * Math.PI

  // Generate random distance within radius
  const distance = Math.random() * radiusMeters

  // Calculate new coordinates
  const R = 6371e3 // Earth's radius in meters
  const latOffset = (distance * Math.cos(angle)) / R * (180 / Math.PI)
  const lonOffset = (distance * Math.sin(angle)) / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI)

  return {
    latitude: lat + latOffset,
    longitude: lon + lonOffset,
    accuracy: 10,
  }
}

/**
 * Mock geolocation for development
 */
export function mockGeolocation(coordinates: Coordinates): void {
  if (typeof window === 'undefined') return

  // @ts-ignore
  navigator.geolocation = {
    getCurrentPosition: (success: PositionCallback) => {
      success({
        coords: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: coordinates.accuracy || 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition)
    },
    watchPosition: () => 1,
    clearWatch: () => {},
  }
}
