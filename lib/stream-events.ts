/**
 * Event types streamed from /api/extract/stream to the client.
 *
 * Each event has a stable `type` discriminator. Server emits these as
 * SSE `data:` lines (one JSON object per event).
 */

import type { SourceKind } from './types'

export type ExtractEvent =
  | {
      type: 'video.loaded'
      data: {
        videoId: string
        sourceKind: SourceKind
        url: string
        title?: string
        thumbnailUrl?: string
        channelName?: string
      }
    }
  | {
      type: 'extraction.started'
      data: { message: string }
    }
  | {
      type: 'extraction.found'
      data: { count: number }
    }
  | {
      type: 'restaurant.found'
      data: {
        // synthetic client-side id; the real DB id arrives with .geocoded
        clientId: string
        name: string
        nameLocal?: string
        city: string
        country: string
        cuisine?: string
        dish?: string
        quote: string
        timestampSec?: number
      }
    }
  | {
      type: 'restaurant.geocoded'
      data: {
        clientId: string
        // null if dedup hit an existing row — same DB id is returned anyway
        id: string
        lat: number
        lng: number
        photoName?: string
        placesId?: string
        priceLevel?: 1 | 2 | 3 | 4
        existed: boolean
      }
    }
  | {
      type: 'restaurant.skipped'
      data: { clientId: string; name: string; reason: string }
    }
  | {
      type: 'complete'
      data: {
        videoId: string
        restaurantsAdded: number
        mentionsAdded: number
        skippedNoGeocode: number
      }
    }
  | {
      type: 'error'
      data: { message: string }
    }

export type ExtractEventType = ExtractEvent['type']
