import { supabaseAdmin } from './supabase-server'

export type CuratedList = {
  creatorSlug: string
  creatorName: string
  city: string
  country: string
  count: number
  photoNames: string[]
}

/**
 * Aggregate restaurants into "lists" — one per (creator, city).
 * Each list reads as "Mark Wiens × Hong Kong" and surfaces the top
 * photo names so the card can render a real food-photo collage.
 */
export async function getCuratedLists(limit = 12): Promise<CuratedList[]> {
  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from('mentions')
    .select(
      `restaurant_id,
       videos!inner ( creator_slug, creators!inner ( slug, name ) ),
       restaurants!inner ( id, city, country, photo_name )`
    )
    .limit(2000)

  if (error || !data) return []

  type Row = {
    restaurant_id: string
    videos: { creator_slug: string | null; creators: { slug: string; name: string } | null }
    restaurants: { id: string; city: string; country: string; photo_name: string | null }
  }
  const rows = data as unknown as Row[]

  type Bucket = CuratedList & { restaurantIds: Set<string> }
  const buckets = new Map<string, Bucket>()

  for (const r of rows) {
    const creator = r.videos.creators
    if (!creator) continue
    const key = `${creator.slug}|${r.restaurants.city}|${r.restaurants.country}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        creatorSlug: creator.slug,
        creatorName: creator.name,
        city: r.restaurants.city,
        country: r.restaurants.country,
        count: 0,
        photoNames: [],
        restaurantIds: new Set(),
      }
      buckets.set(key, bucket)
    }
    if (bucket.restaurantIds.has(r.restaurants.id)) continue
    bucket.restaurantIds.add(r.restaurants.id)
    bucket.count++
    if (r.restaurants.photo_name && bucket.photoNames.length < 4) {
      bucket.photoNames.push(r.restaurants.photo_name)
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ restaurantIds: _ids, ...rest }) => {
      void _ids
      return rest
    })
}
