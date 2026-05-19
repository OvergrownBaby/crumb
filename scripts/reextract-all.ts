/**
 * One-off: re-run the full extraction pipeline on every video already in the
 * database. Used after schema changes that require Gemini to re-emit data
 * (e.g. the dish_mentions migration — old `mentions.dish` was a single string).
 *
 * Safe to re-run: ingestUrl upserts on (name_normalized, city, country) for
 * restaurants and (mention_id, name) for dishes, so duplicates are
 * idempotent. Stale dish_mentions are NOT auto-deleted — wipe the table
 * first if you want a clean slate.
 *
 * Usage:
 *   npx tsx scripts/reextract-all.ts            # all videos
 *   npx tsx scripts/reextract-all.ts <slug>     # only this creator
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 30_000 // Gemini 503 usually clears in 30-120s
const PACING_MS = 5_000 // gap between videos to avoid hammering

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  // Gemini's "high demand" / overload / timeout — usually transient.
  return /\b(429|503|504|UNAVAILABLE|overloaded|high demand|timeout)\b/i.test(msg)
}

async function ingestWithRetry(
  ingestUrl: (url: string) => Promise<{
    restaurantsAdded: number
    mentionsAdded: number
  }>,
  url: string
) {
  let lastErr: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await ingestUrl(url)
    } catch (e) {
      lastErr = e
      if (!isRetryable(e) || attempt === MAX_RETRIES - 1) throw e
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt)
      process.stdout.write(
        `\n    ⟳ retryable error — waiting ${(backoff / 1000).toFixed(0)}s before retry ${attempt + 2}/${MAX_RETRIES}… `
      )
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
  throw lastErr
}

async function main() {
  const { supabaseAdmin } = await import('../lib/supabase-server')
  const { ingestUrl } = await import('../lib/pipeline')

  const sb = supabaseAdmin()
  const slugFilter = process.argv[2]

  let query = sb.from('videos').select('id, url, title, creator_slug').order('created_at', { ascending: true })
  if (slugFilter) query = query.eq('creator_slug', slugFilter)

  const { data: videos, error } = await query
  if (error || !videos) {
    console.error('Failed to load videos:', error?.message)
    process.exit(1)
  }

  console.log(`Re-extracting ${videos.length} videos${slugFilter ? ` for ${slugFilter}` : ''}…\n`)

  let ok = 0
  let failed = 0
  const start = Date.now()

  for (const [i, v] of videos.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, PACING_MS))

    const t0 = Date.now()
    const tag = `[${i + 1}/${videos.length}]`
    process.stdout.write(`${tag} ${v.url}\n  ${v.title?.slice(0, 80) ?? '(no title)'}\n  → `)

    try {
      const result = await ingestWithRetry(ingestUrl, v.url)
      const dt = ((Date.now() - t0) / 1000).toFixed(1)
      process.stdout.write(
        `✓ ${result.restaurantsAdded}r/${result.mentionsAdded}m (${dt}s)\n\n`
      )
      ok++
    } catch (e) {
      const dt = ((Date.now() - t0) / 1000).toFixed(1)
      const msg = e instanceof Error ? e.message : String(e)
      process.stdout.write(`✗ FAILED (${dt}s): ${msg.slice(0, 200)}\n\n`)
      failed++
    }
  }

  const total = ((Date.now() - start) / 60_000).toFixed(1)
  console.log(`\n━━━ Done in ${total}min · ${ok} ok · ${failed} failed ━━━`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
