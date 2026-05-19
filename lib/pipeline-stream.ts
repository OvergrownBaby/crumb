/**
 * Streaming variant of ingestUrl(). Returns an AsyncGenerator that yields
 * ExtractEvent values as work happens — meant to be wrapped by an SSE
 * route handler.
 *
 * Key behaviour:
 *   - Emits video.loaded first (synchronous from fetchUrl).
 *   - Calls extractRestaurants() (blocks ~60-90s for video — Gemini buffers
 *     the watching phase, so there's nothing to stream in this window;
 *     the client shows a thumbnail + scan animation during this gap).
 *   - Emits extraction.found with total count after Gemini returns.
 *   - For each restaurant: emits restaurant.found, geocodes, then either
 *     restaurant.geocoded (with real DB id) or restaurant.skipped.
 *   - Geocoding runs sequentially so the client gets a satisfying drip-feed
 *     of pin drops rather than all at once.
 */
import { randomUUID } from 'crypto'
import { supabaseAdmin } from './supabase-server'
import { fetchUrl, type FetchedContent } from './fetchers'
import { extractRestaurants } from './extractor'
import { geocodeRestaurant } from './geocoder'
import { normalizeName } from './normalize'
import type { ExtractEvent } from './stream-events'

export async function* ingestUrlStream(
  url: string,
  opts: { geminiKey?: string; signal?: AbortSignal } = {}
): AsyncGenerator<ExtractEvent> {
  const sb = supabaseAdmin()

  // 1. Fetch metadata. Synchronous, fast.
  let content: FetchedContent
  try {
    content = await fetchUrl(url)
  } catch (e) {
    yield {
      type: 'error',
      data: { message: e instanceof Error ? e.message : String(e) },
    }
    return
  }

  const videoId = videoIdFor(content)

  yield {
    type: 'video.loaded',
    data: {
      videoId,
      sourceKind: content.sourceKind,
      url: content.url,
      title: 'title' in content ? content.title : undefined,
      thumbnailUrl: 'thumbnailUrl' in content ? content.thumbnailUrl : undefined,
      channelName: 'channelName' in content ? content.channelName : undefined,
    },
  }

  // 2. Upsert creator (if YouTube w/ channel) + video row up front.
  let creatorSlug: string | null = null
  if (content.kind === 'video_url' && content.channelName) {
    creatorSlug = await upsertCreator({
      name: content.channelName,
      platform: 'youtube',
      url: content.channelId ? `https://youtube.com/channel/${content.channelId}` : undefined,
    })
  }

  await sb.from('videos').upsert({
    id: videoId,
    url: content.url,
    source_kind: content.sourceKind,
    creator_slug: creatorSlug,
    title: 'title' in content ? content.title : undefined,
    thumbnail_url: 'thumbnailUrl' in content ? content.thumbnailUrl : undefined,
    published_at: 'publishedAt' in content ? content.publishedAt : undefined,
    raw_transcript: content.kind === 'text' ? content.text.slice(0, 200_000) : null,
  })

  // 3. The slow phase — Gemini watching the video. No events emitted
  //    during this window because Gemini buffers everything; we'd just
  //    be lying. The client shows the thumbnail + scan animation.
  yield {
    type: 'extraction.started',
    data: {
      message:
        content.kind === 'video_url'
          ? "Gemini's watching the video. This takes about a minute for a 30-min video."
          : 'Reading the article and extracting restaurants…',
    },
  }

  if (opts.signal?.aborted) return

  let extracted
  try {
    extracted = await extractRestaurants(content, { geminiKey: opts.geminiKey })
  } catch (e) {
    yield {
      type: 'error',
      data: { message: e instanceof Error ? e.message : String(e) },
    }
    return
  }

  if (opts.signal?.aborted) return

  yield { type: 'extraction.found', data: { count: extracted.length } }

  if (extracted.length === 0) {
    yield {
      type: 'complete',
      data: { videoId, restaurantsAdded: 0, mentionsAdded: 0, skippedNoGeocode: 0 },
    }
    return
  }

  // 4. Sequential geocode + DB upsert per restaurant. Each yields events
  //    so the client can animate cards sliding in + pins dropping.
  let restaurantsAdded = 0
  let mentionsAdded = 0
  let skippedNoGeocode = 0

  for (const r of extracted) {
    if (opts.signal?.aborted) return

    const clientId = randomUUID()

    yield {
      type: 'restaurant.found',
      data: {
        clientId,
        name: r.name,
        nameLocal: r.nameLocal,
        city: r.city,
        country: r.country,
        cuisine: r.cuisine,
        dish: r.dish,
        quote: r.quote,
        timestampSec: r.timestampSec,
      },
    }

    const geo = await geocodeRestaurant({ name: r.name, city: r.city, country: r.country })
    if (!geo) {
      skippedNoGeocode++
      yield {
        type: 'restaurant.skipped',
        data: { clientId, name: r.name, reason: 'No matching place on the map' },
      }
      continue
    }

    // Dedup by places_id first
    let restaurantId: string | null = null
    let existed = false
    if (geo.placesId) {
      const { data: existing } = await sb
        .from('restaurants')
        .select('id')
        .eq('places_id', geo.placesId)
        .maybeSingle()
      if (existing) {
        restaurantId = existing.id
        existed = true
      }
    }

    if (!restaurantId) {
      const { data: row, error: rErr } = await sb
        .from('restaurants')
        .upsert(
          {
            name: r.name,
            name_local: r.nameLocal ?? null,
            name_normalized: normalizeName(r.name),
            city: r.city,
            country: r.country,
            lat: geo.lat,
            lng: geo.lng,
            cuisine: r.cuisine ?? null,
            price_level: r.priceLevel ?? geo.priceLevel ?? null,
            places_id: geo.placesId,
            photo_name: geo.photoName ?? null,
          },
          { onConflict: 'name_normalized,city,country' }
        )
        .select('id')
        .single()

      if (rErr || !row) {
        yield {
          type: 'restaurant.skipped',
          data: { clientId, name: r.name, reason: rErr?.message ?? 'db error' },
        }
        continue
      }
      restaurantId = row.id
      restaurantsAdded++
    }

    const { error: mErr } = await sb.from('mentions').upsert(
      {
        restaurant_id: restaurantId,
        video_id: videoId,
        dish: r.dish ?? null,
        quote: r.quote,
        timestamp_sec: r.timestampSec ?? null,
      },
      { onConflict: 'restaurant_id,video_id' }
    )
    if (!mErr) mentionsAdded++

    if (!restaurantId) continue
    const finalRestaurantId: string = restaurantId

    yield {
      type: 'restaurant.geocoded',
      data: {
        clientId,
        id: finalRestaurantId,
        lat: geo.lat,
        lng: geo.lng,
        photoName: geo.photoName,
        placesId: geo.placesId,
        priceLevel: r.priceLevel ?? geo.priceLevel,
        existed,
      },
    }
  }

  yield {
    type: 'complete',
    data: { videoId, restaurantsAdded, mentionsAdded, skippedNoGeocode },
  }
}

function videoIdFor(content: FetchedContent): string {
  if (content.kind === 'video_url') return `yt:${content.videoId}`
  return `${content.sourceKind}:${hashUrl(content.url)}`
}

function hashUrl(url: string): string {
  let h = 0
  for (let i = 0; i < url.length; i++) {
    h = (h << 5) - h + url.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36)
}

async function upsertCreator(args: {
  name: string
  platform: 'youtube' | 'tiktok' | 'instagram' | 'reddit' | 'web'
  url?: string
}): Promise<string> {
  const sb = supabaseAdmin()
  const slug = args.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  await sb
    .from('creators')
    .upsert(
      { slug, name: args.name, platform: args.platform, url: args.url ?? null },
      { onConflict: 'slug', ignoreDuplicates: false }
    )
  return slug
}
