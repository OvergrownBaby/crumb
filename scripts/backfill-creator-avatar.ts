/**
 * One-off: backfill a creator's avatar by fetching it from their channel.
 *
 * Usage:
 *   npx tsx scripts/backfill-creator-avatar.ts <creator-slug>
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. Fetches one of the
 * creator's videos to scrape the channelId from the watch page HTML, then
 * delegates to fetchAndStoreChannelAvatar.
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: npx tsx scripts/backfill-creator-avatar.ts <creator-slug>')
    process.exit(1)
  }

  const { supabaseAdmin } = await import('../lib/supabase-server')
  const { fetchAndStoreChannelAvatar } = await import('../lib/avatar-fetcher')

  const sb = supabaseAdmin()

  // Get any video for this creator → scrape channelId from its watch page.
  const { data: video } = await sb
    .from('videos')
    .select('url')
    .eq('creator_slug', slug)
    .limit(1)
    .maybeSingle()

  if (!video) {
    console.error(`No videos found for creator "${slug}"`)
    process.exit(1)
  }

  console.log(`Scraping channelId from ${video.url}…`)
  const html = await fetch(video.url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  }).then((r) => r.text())

  const match =
    html.match(/"externalChannelId":"(UC[\w-]{20,30})"/) ??
    html.match(/"channelId":"(UC[\w-]{20,30})"/)
  if (!match) {
    console.error('Could not extract channelId from watch page')
    process.exit(1)
  }
  const channelId = match[1]
  console.log(`channelId = ${channelId}`)

  console.log('Fetching avatar and uploading to Storage…')
  const avatarUrl = await fetchAndStoreChannelAvatar({ channelId, slug })
  if (!avatarUrl) {
    console.error('Avatar fetch failed')
    process.exit(1)
  }
  console.log(`Stored at ${avatarUrl}`)

  const { error } = await sb
    .from('creators')
    .update({ avatar_url: avatarUrl })
    .eq('slug', slug)
  if (error) {
    console.error(`DB update failed: ${error.message}`)
    process.exit(1)
  }

  console.log(`✓ avatar_url set for ${slug}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
