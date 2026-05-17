import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { ingestUrl } from '@/lib/pipeline'

export const runtime = 'nodejs'
// Long-running: video extraction can take 30-90s
export const maxDuration = 300

export async function POST(req: Request) {
  let url: string
  try {
    const body = (await req.json()) as { url?: unknown }
    if (typeof body.url !== 'string' || !body.url.trim()) {
      return NextResponse.json({ error: 'url required' }, { status: 400 })
    }
    url = body.url.trim()
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
  }

  // Create job row up front so the UI can show progress
  const sb = supabaseAdmin()
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null

  const { data: job, error: jobErr } = await sb
    .from('jobs')
    .insert({ url, status: 'fetching', user_ip: ip })
    .select('id')
    .single()

  if (jobErr || !job) {
    return NextResponse.json({ error: `failed to create job: ${jobErr?.message}` }, { status: 500 })
  }

  // Run synchronously for v1 — Vercel allows up to 300s, plenty for one video.
  // v1.5 we can move this to a worker queue.
  try {
    await sb.from('jobs').update({ status: 'extracting', progress: 'Watching content...' }).eq('id', job.id)

    const result = await ingestUrl(url)

    await sb
      .from('jobs')
      .update({
        status: 'done',
        progress: `${result.restaurantsAdded} restaurants, ${result.mentionsAdded} mentions`,
        result_video_id: result.videoId,
      })
      .eq('id', job.id)

    // Fetch the actual restaurants we just added for the response
    const { data: mentions } = await sb
      .from('mentions')
      .select('id, restaurant_id, dish, quote, timestamp_sec, restaurants(*)')
      .eq('video_id', result.videoId)

    return NextResponse.json({
      jobId: job.id,
      videoId: result.videoId,
      restaurantsAdded: result.restaurantsAdded,
      mentionsAdded: result.mentionsAdded,
      skippedNoGeocode: result.skippedNoGeocode,
      mentions: mentions ?? [],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await sb.from('jobs').update({ status: 'failed', error: msg.slice(0, 1000) }).eq('id', job.id)
    return NextResponse.json({ error: msg, jobId: job.id }, { status: 500 })
  }
}
