import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/lib/socket'
import { tokensAPI } from '@/lib/api'
import { Token, QueueInfo, SocketTokenUpdate } from '@/types'
import { toast } from 'sonner'

export function useToken(tokenId: string | null) {
  const { socket, joinToken, leaveToken } = useSocket()
  const [token, setToken] = useState<Token | null>(null)
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch token data
  const fetchToken = useCallback(async () => {
    if (!tokenId) return

    try {
      setLoading(true)
      const [tokenRes, queueRes] = await Promise.all([
        tokensAPI.getById(tokenId),
        tokensAPI.getPosition(tokenId),
      ])
      setToken(tokenRes.data)
      setQueueInfo(queueRes.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load token')
      toast.error('Failed to load token data')
    } finally {
      setLoading(false)
    }
  }, [tokenId])

  // Initial fetch
  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // Join WebSocket room
  useEffect(() => {
    if (!tokenId || !socket) return

    joinToken(tokenId)

    // Listen for updates
    socket.on('token:update', (data: SocketTokenUpdate) => {
      setToken(data.token)
      setQueueInfo(data.queueInfo)
    })

    socket.on('queue:update', () => {
      // Refresh queue position
      tokensAPI.getPosition(tokenId).then(res => {
        setQueueInfo(res.data)
      })
    })

    socket.on('token:your_turn', () => {
      toast.success("It's your turn! Please proceed to the counter.", {
        duration: 10000,
      })

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Your Turn!', {
          body: 'Please proceed to the counter.',
          icon: '/logo.png',
        })
      }
    })

    socket.on('token:cancelled', (data: { reason: string }) => {
      toast.error(`Token cancelled: ${data.reason}`)
    })

    return () => {
      socket.off('token:update')
      socket.off('queue:update')
      socket.off('token:your_turn')
      socket.off('token:cancelled')
      leaveToken(tokenId)
    }
  }, [tokenId, socket, joinToken, leaveToken])

  // Cancel token
  const cancelToken = useCallback(async (reason?: string) => {
    if (!tokenId) return false

    try {
      await tokensAPI.cancel(tokenId, reason)
      toast.success('Token cancelled successfully')
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel token')
      return false
    }
  }, [tokenId])

  return {
    token,
    queueInfo,
    loading,
    error,
    refresh: fetchToken,
    cancelToken,
  }
}
