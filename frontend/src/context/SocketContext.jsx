import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !socketRef.current) {
      socketRef.current = io('http://localhost:5000', {
        transports: ['websocket'],
        autoConnect: true
      })
      socketRef.current.on('connect', () => setConnected(true))
      socketRef.current.on('disconnect', () => setConnected(false))
    }

    return () => {
      if (socketRef.current && !isAuthenticated) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
    }
  }, [isAuthenticated])

  const getSocket = () => socketRef.current

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, getSocket }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
