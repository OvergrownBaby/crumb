import { supabaseAdmin } from './supabase-server'
import type { SourceKind } from './types'

export type LatestVideo = {
  id: string // e.g. 'yt:U8VGHShDols'
  /** URL slug for /v/[videoId]. For YouTube this is the bare ID. */
  pathSlug: string
  url: string
  sourceKind: SourceKind
  title: string | null
  thumbnailUrl: string | null
  createdAt: string
  creator: {
    slug: string
    name: string
    avatarUrl: string | null
  } | null
  restaurantCount: number
  /** First few restaurants for the preview strip on the feed card. */
  previewRestaurants: Array<{
    id: string
    name: string
    photoName: string | null
  }>
}

/**
 * Latest parsed videos, sorted by ingestion recency. The home feed unit.
 *
 * Each row arrives with its mentions+restaurants joined in so we don't N+1.
 */
export async function getLatestVideos(limit = 24): Promise<LatestVideo[]> {
  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from('videos')
    .select(
      `id, url, source_kind, title, thumbnail_url, created_at,
       creators ( slug, name, avatar_url ),
       mentions ( restaurants ( id, name, photo_name ) )`
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  type Row = {
    id: string
    url: string
    source_kind: SourceKind
    title: string | null
    thumbnail_url: string | null
    created_at: string
    creators: {
      slug: string
      name: string
      avatar_url: string | null
    } | null
    mentions: Array<{
      restaurants: {
        id: string
        name: string
        photo_name: string | null
      } | null
    }>
  }
  const rows = data as unknown as Row[]

  return rows
    .filter((r) => r.mentions.some((m) => m.restaurants))
    .map((r) => {
      const restaurants = r.mentions
        .map((m) => m.restaurants)
        .filter((x): x is NonNullable<typeof x> => x != null)
      // Dedup by id since the same restaurant can have multiple mentions per video
      const seen = new Set<string>()
      const unique = restaurants.filter((x) => {
        if (seen.has(x.id)) return false
        seen.add(x.id)
        return true
      })
      return {
        id: r.id,
        pathSlug: r.id.startsWith('yt:') ? r.id.slice(3) : r.id,
        url: r.url,
        sourceKind: r.source_kind,
        title: r.title,
        thumbnailUrl: r.thumbnail_url,
        createdAt: r.created_at,
        creator: r.creators
          ? {
              slug: r.creators.slug,
              name: r.creators.name,
              avatarUrl: r.creators.avatar_url,
            }
          : null,
        restaurantCount: unique.length,
        previewRestaurants: unique.slice(0, 4).map((x) => ({
          id: x.id,
          name: x.name,
          photoName: x.photo_name,
        })),
      }
    })
}
