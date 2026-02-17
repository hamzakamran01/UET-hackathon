'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinToken: (tokenId: string) => void
  leaveToken: (tokenId: string) => void
  joinService: (serviceId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinToken: () => { },
  leaveToken: () => { },
  joinService: () => { },
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io(`${WS_URL}/queue`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('error', (error) => {
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const joinToken = useCallback((tokenId: string) => {
    if (socket) {
      socket.emit('join:token', { tokenId })
    }
  }, [socket])

  const leaveToken = useCallback((tokenId: string) => {
    if (socket) {
      socket.emit('leave:token', { tokenId })
    }
  }, [socket])

  const joinService = useCallback((serviceId: string) => {
    if (socket) {
      socket.emit('join:service', { serviceId })
    }
  }, [socket])

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinToken,
        leaveToken,
        joinService,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
