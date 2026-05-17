import type {
  Restaurant,
  Mention,
  Creator,
  AtlasFilters,
  ExtractJob,
} from './types'
import { MOCK_RESTAURANTS, MOCK_MENTIONS, CREATORS, MARK_WIENS } from './mock-data'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

// Server-side fetches use the absolute path; browser uses relative.
// VERCEL_PROJECT_PRODUCTION_URL is the public alias (e.g. crumb-vert.vercel.app);
// VERCEL_URL is the deployment-specific URL which is auth-protected.
function apiBase(): string {
  if (typeof window !== 'undefined') return ''
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3001'
}

export async function getAtlas(filters: AtlasFilters = {}): Promise<Restaurant[]> {
  if (USE_MOCK) {
    let results = MOCK_RESTAURANTS
    if (filters.creator) {
      results = results.filter((r) =>
        r.topCreators.some((c) => c.slug === filters.creator)
      )
    }
    if (filters.city) results = results.filter((r) => r.city === filters.city)
    if (filters.country) results = results.filter((r) => r.country === filters.country)
    if (filters.sourceKind && filters.sourceKind.length > 0) {
      const inSource = new Set(
        MOCK_MENTIONS.filter((m) => filters.sourceKind!.includes(m.source.kind)).map(
          (m) => m.restaurantId
        )
      )
      results = results.filter((r) => inSource.has(r.id))
    }
    return results
  }

  const params = new URLSearchParams()
  if (filters.creator) params.set('creator', filters.creator)
  if (filters.city) params.set('city', filters.city)
  if (filters.country) params.set('country', filters.country)
  if (filters.sourceKind) params.set('source', filters.sourceKind.join(','))

  const res = await fetch(`${apiBase()}/api/atlas?${params}`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export async function getRestaurant(
  id: string
): Promise<{ restaurant: Restaurant; mentions: Mention[] } | null> {
  if (USE_MOCK) {
    const restaurant = MOCK_RESTAURANTS.find((r) => r.id === id)
    if (!restaurant) return null
    return { restaurant, mentions: MOCK_MENTIONS.filter((m) => m.restaurantId === id) }
  }

  const res = await fetch(`${apiBase()}/api/place/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function getCreator(
  slug: string
): Promise<{
  creator: Creator
  restaurants: Restaurant[]
  mentions: Mention[]
} | null> {
  if (USE_MOCK) {
    const creator = CREATORS.find((c) => c.slug === slug)
    if (!creator) return null
    const restaurants = MOCK_RESTAURANTS.filter((r) =>
      r.topCreators.some((c) => c.slug === slug)
    )
    const restaurantIds = new Set(restaurants.map((r) => r.id))
    const mentions = MOCK_MENTIONS.filter((m) => restaurantIds.has(m.restaurantId))
    return { creator, restaurants, mentions }
  }

  const res = await fetch(`${apiBase()}/api/creator/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function listCreators(): Promise<Creator[]> {
  if (USE_MOCK) return CREATORS
  const res = await fetch(`${apiBase()}/api/creators`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export async function submitUrl(url: string): Promise<ExtractJob> {
  if (USE_MOCK) {
    return { id: `job-${Math.random().toString(36).slice(2, 8)}`, url, status: 'queued' }
  }
  const res = await fetch(`${apiBase()}/api/extract`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return res.json()
}

export async function getJob(id: string): Promise<ExtractJob | null> {
  if (USE_MOCK) {
    const stages = ['queued', 'fetching', 'extracting', 'geocoding', 'done'] as const
    const idx = parseInt(id.slice(-1), 16) % stages.length
    return {
      id,
      url: 'https://www.youtube.com/watch?v=HWMga1ULQEU',
      status: stages[idx % stages.length],
    }
  }
  const res = await fetch(`${apiBase()}/api/jobs/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export function getFeaturedCreators(): Creator[] {
  return [MARK_WIENS]
}
