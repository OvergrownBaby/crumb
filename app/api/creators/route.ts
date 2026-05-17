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
       videos ( id, mentions ( restaurant_id ) )`
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const out: Creator[] = (rows ?? []).map((c: {
    slug: string
    name: string
    platform: string
    avatar_url: string | null
    url: string | null
    videos: Array<{ id: string; mentions: Array<{ restaurant_id: string }> }>
  }) => {
    const videos = c.videos ?? []
    const restaurantSet = new Set<string>()
    for (const v of videos) for (const m of v.mentions ?? []) restaurantSet.add(m.restaurant_id)
    return {
      slug: c.slug,
      name: c.name,
      platform: c.platform as Creator['platform'],
      avatarUrl: c.avatar_url ?? undefined,
      url: c.url ?? undefined,
      videoCount: videos.length,
      restaurantCount: restaurantSet.size,
    }
  })

  return NextResponse.json(out)
}
