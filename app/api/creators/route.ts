import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import type { Creator } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET() {
  const sb = supabaseAdmin()

  // Pull all creators + computed counts via aggregations
  const { data: rows, error } = await sb
    .from('creators')
    .select(
      `slug, name, platform, avatar_url, url,
       videos ( id, mentions ( restaurants ( id, city ) ) )`
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Row = {
    slug: string
    name: string
    platform: string
    avatar_url: string | null
    url: string | null
    videos: Array<{
      id: string
      mentions: Array<{ restaurants: { id: string; city: string } | null }>
    }>
  }
  const typedRows = (rows ?? []) as unknown as Row[]

  const out: Creator[] = typedRows.map((c) => {
    const videos = c.videos ?? []
    const restaurantSet = new Set<string>()
    const citySet = new Set<string>()
    for (const v of videos) {
      for (const m of v.mentions ?? []) {
        if (!m.restaurants) continue
        restaurantSet.add(m.restaurants.id)
        citySet.add(m.restaurants.city)
      }
    }
    return {
      slug: c.slug,
      name: c.name,
      platform: c.platform as Creator['platform'],
      avatarUrl: c.avatar_url ?? undefined,
      url: c.url ?? undefined,
      videoCount: videos.length,
      restaurantCount: restaurantSet.size,
      cityCount: citySet.size,
    }
  })

  return NextResponse.json(out)
}
