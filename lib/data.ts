import type {
  Restaurant,
  Mention,
  Creator,
  AtlasFilters,
} from './types'

// Server-side fetches use the absolute path; browser uses relative.
// VERCEL_PROJECT_PRODUCTION_URL is the public alias (e.g. thefoodcrawl.com);
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
  const res = await fetch(`${apiBase()}/api/creator/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function listCreators(): Promise<Creator[]> {
  const res = await fetch(`${apiBase()}/api/creators`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}
