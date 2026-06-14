'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { services } from '@/services/api'

export interface ScanEvent {
  scanId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress?: number
  message?: string
  vulnerabilitiesFound?: number
  timestamp: string
}

interface UseScanSSEOptions {
  scanId: string | null
  enabled?: boolean
  onEvent?: (event: ScanEvent) => void
}

export function useScanSSE({ scanId, enabled = true, onEvent }: UseScanSSEOptions) {
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [usePolling, setUsePolling] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!scanId) return
    try {
      const scan = await services.getScan(scanId)
      setStatus(scan.status)
      setProgress(scan.progress ?? 0)
    } catch {
      // ignore
    }
  }, [scanId])

  useEffect(() => {
    if (!scanId || !enabled) {
      setConnected(false)
      return
    }

    if (usePolling) {
      fetchStatus()
      pollingRef.current = setInterval(fetchStatus, 3000)
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
    }

    const es = new EventSource(`/api/v1/live-scans/stream?scanId=${scanId}`)

    es.onopen = () => setConnected(true)

    es.addEventListener('scan-event', (e) => {
      try {
        const event: ScanEvent = JSON.parse(e.data)
        setStatus(event.status)
        setProgress(event.progress ?? 0)
        setMessage(event.message ?? '')
        onEvent?.(event)
        if (event.status === 'completed' || event.status === 'failed') {
          es.close()
        }
      } catch {
        // ignore malformed events
      }
    })

    es.onerror = () => {
      setConnected(false)
      es.close()
      setUsePolling(true)
    }

    eventSourceRef.current = es

    return () => {
      es.close()
      setConnected(false)
    }
  }, [scanId, enabled, usePolling, onEvent, fetchStatus])

  return { status, progress, message, connected, polling: usePolling }
}
