'use client'

import { useCallback, useRef, useState } from 'react'
import type { ExtractEvent } from './stream-events'

export type StreamStatus =
  | 'idle'
  | 'connecting'
  | 'watching'
  | 'extracting'
  | 'complete'
  | 'failed'

export type RestaurantArrival = {
  clientId: string
  name: string
  nameLocal?: string
  city: string
  country: string
  cuisine?: string
  dish?: string
  quote: string
  timestampSec?: number
  // Populated after geocoded event
  id?: string
  lat?: number
  lng?: number
  photoName?: string
  priceLevel?: 1 | 2 | 3 | 4
  // Skipped state
  skipped?: boolean
  skipReason?: string
}

export type VideoMeta = {
  videoId: string
  url: string
  sourceKind: string
  title?: string
  thumbnailUrl?: string
  channelName?: string
}

export type StreamState = {
  status: StreamStatus
  video: VideoMeta | null
  message: string
  restaurants: RestaurantArrival[]
  startedAt: number | null
  finishedAt: number | null
  totalCount: number | null
  error: string | null
  result: {
    videoId: string
    restaurantsAdded: number
    mentionsAdded: number
    skippedNoGeocode: number
  } | null
}

const INITIAL: StreamState = {
  status: 'idle',
  video: null,
  message: '',
  restaurants: [],
  startedAt: null,
  finishedAt: null,
  totalCount: null,
  error: null,
  result: null,
}

/**
 * Hook: POSTs to /api/extract/stream, consumes the SSE events, and exposes
 * accumulated state for the LiveExtractionView component to render.
 */
export function useStreamExtract() {
  const [state, setState] = useState<StreamState>(INITIAL)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(INITIAL)
  }, [])

  const submit = useCallback(async (url: string, geminiKey?: string | null) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({
      ...INITIAL,
      status: 'connecting',
      startedAt: Date.now(),
    })

    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (geminiKey) headers['x-gemini-key'] = geminiKey

    let res: Response
    try {
      res = await fetch('/api/extract/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })
    } catch (err) {
      if (controller.signal.aborted) return
      setState((s) => ({
        ...s,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        finishedAt: Date.now(),
      }))
      return
    }

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`
      try {
        const body = (await res.json()) as { error?: string }
        if (body.error) errMsg = body.error
      } catch {}
      setState((s) => ({ ...s, status: 'failed', error: errMsg, finishedAt: Date.now() }))
      return
    }

    if (!res.body) {
      setState((s) => ({ ...s, status: 'failed', error: 'No response body', finishedAt: Date.now() }))
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE frames are separated by `\n\n`
        const frames = buffer.split(/\n\n/)
        buffer = frames.pop() ?? '' // last fragment may be incomplete

        for (const frame of frames) {
          if (!frame.trim()) continue
          let eventName = 'message'
          let dataText = ''
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) dataText += line.slice(5).trim()
          }
          if (!dataText) continue
          let parsed: unknown
          try {
            parsed = JSON.parse(dataText)
          } catch {
            continue
          }
          handleEvent({ type: eventName, data: parsed } as unknown as ExtractEvent)
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return
      setState((s) => ({
        ...s,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        finishedAt: Date.now(),
      }))
    }

    function handleEvent(e: ExtractEvent) {
      setState((s) => applyEvent(s, e))
    }
  }, [])

  return { state, submit, reset }
}

function applyEvent(s: StreamState, e: ExtractEvent): StreamState {
  switch (e.type) {
    case 'video.loaded':
      return {
        ...s,
        status: 'watching',
        video: {
          videoId: e.data.videoId,
          url: e.data.url,
          sourceKind: e.data.sourceKind,
          title: e.data.title,
          thumbnailUrl: e.data.thumbnailUrl,
          channelName: e.data.channelName,
        },
      }
    case 'extraction.started':
      return { ...s, message: e.data.message }
    case 'extraction.found':
      return { ...s, status: 'extracting', totalCount: e.data.count }
    case 'restaurant.found':
      return {
        ...s,
        restaurants: [
          ...s.restaurants,
          {
            clientId: e.data.clientId,
            name: e.data.name,
            nameLocal: e.data.nameLocal,
            city: e.data.city,
            country: e.data.country,
            cuisine: e.data.cuisine,
            dish: e.data.dish,
            quote: e.data.quote,
            timestampSec: e.data.timestampSec,
          },
        ],
      }
    case 'restaurant.geocoded':
      return {
        ...s,
        restaurants: s.restaurants.map((r) =>
          r.clientId === e.data.clientId
            ? {
                ...r,
                id: e.data.id,
                lat: e.data.lat,
                lng: e.data.lng,
                photoName: e.data.photoName,
                priceLevel: e.data.priceLevel,
              }
            : r
        ),
      }
    case 'restaurant.skipped':
      return {
        ...s,
        restaurants: s.restaurants.map((r) =>
          r.clientId === e.data.clientId
            ? { ...r, skipped: true, skipReason: e.data.reason }
            : r
        ),
      }
    case 'complete':
      return {
        ...s,
        status: 'complete',
        finishedAt: Date.now(),
        result: e.data,
      }
    case 'error':
      return { ...s, status: 'failed', error: e.data.message, finishedAt: Date.now() }
    default:
      return s
  }
}
