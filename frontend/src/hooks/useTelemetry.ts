/**
 * WebSocket hook for real-time telemetry streaming.
 */
import { useEffect, useRef, useCallback } from 'react'
import { usePlantStore } from '../store/plantStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/telemetry'

export function useTelemetry() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setConnected, updateTelemetry } = usePlantStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('[WS] Connected to telemetry stream')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        updateTelemetry(data)
      } catch (e) {
        console.error('[WS] Parse error:', e)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('[WS] Disconnected, reconnecting in 2s...')
      reconnectRef.current = setTimeout(connect, 2000)
    }

    ws.onerror = (err) => {
      console.error('[WS] Error:', err)
      ws.close()
    }
  }, [setConnected, updateTelemetry])

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(command)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { sendCommand }
}
