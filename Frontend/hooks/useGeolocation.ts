import { useState, useEffect, useCallback } from 'react'
import {
  getCurrentPosition,
  watchPosition,
  clearWatch,
  checkPermission,
  GeolocationResult,
  GeolocationError,
} from '@/lib/geolocation'
import { Coordinates, GeolocationState } from '@/types'

export function useGeolocation(watch: boolean = false) {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
    permissionStatus: null,
  })

  const [watchId, setWatchId] = useState<number | null>(null)

  // Get current position
  const getPosition = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await getCurrentPosition()
      setState(prev => ({
        ...prev,
        coordinates: result.coordinates,
        loading: false,
      }))
      return result.coordinates
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }))
      return null
    }
  }, [])

  // Check permission
  useEffect(() => {
    checkPermission().then(status => {
      setState(prev => ({ ...prev, permissionStatus: status }))
    })
  }, [])

  // Watch position
  useEffect(() => {
    if (!watch) return

    const id = watchPosition(
      (result: GeolocationResult) => {
        setState(prev => ({
          ...prev,
          coordinates: result.coordinates,
          loading: false,
          error: null,
        }))
      },
      (error: GeolocationError) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }))
      }
    )

    if (id !== null) {
      setWatchId(id)
    }

    return () => {
      if (id !== null) {
        clearWatch(id)
      }
    }
  }, [watch])

  return {
    ...state,
    getPosition,
    refresh: getPosition,
  }
}
