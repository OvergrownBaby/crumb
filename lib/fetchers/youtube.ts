import type { FetchedContent } from './index'

/**
 * Extract video ID from any YouTube URL form (watch?v, youtu.be, shorts/).
 */
export function youtubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('/')[0] || null
    }
    if (u.pathname.startsWith('/shorts/')) {
      return u.pathname.split('/')[2] || null
    }
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

/**
 * For YouTube we don't actually fetch content here. Gemini will fetch it
 * directly via fileData.fileUri. We just normalize the URL and try to grab
 * metadata via the oEmbed endpoint (no key required, lightly rate-limited).
 */
export async function fetchYouTube(url: string): Promise<FetchedContent> {
  const videoId = youtubeIdFromUrl(url)
  if (!videoId) throw new Error(`Could not parse YouTube video ID from ${url}`)

  // Canonical URL for Gemini ingestion
  const canonical = `https://www.youtube.com/watch?v=${videoId}`

  // Best-effort metadata via oEmbed
  let title: string | undefined
  let thumbnailUrl: string | undefined
  let channelName: string | undefined
  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (oembed.ok) {
      const data = (await oembed.json()) as {
        title?: string
        thumbnail_url?: string
        author_name?: string
      }
      title = data.title
      thumbnailUrl = data.thumbnail_url
      channelName = data.author_name
    }
  } catch {
    // ignore — Gemini will still work, we just won't have title until extraction
  }

  // Best-effort scrape of channelId + description from watch page. ChannelId
  // is used downstream to fetch the channel's og:image avatar. Description is
  // passed to Gemini as canonical ground-truth for restaurant names.
  const { channelId, description } = await scrapeWatchPage(canonical).catch(
    () => ({ channelId: undefined, description: undefined })
  )

  return {
    kind: 'video_url',
    sourceKind: 'youtube',
    videoId,
    url: canonical,
    title,
    thumbnailUrl,
    channelName,
    channelId,
    description,
  }
}

async function scrapeWatchPage(
  watchUrl: string
): Promise<{ channelId?: string; description?: string }> {
  const res = await fetch(watchUrl, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      // Skip YouTube's EU consent interstitial. Without this, datacenter IPs
      // (Vercel, AWS) get served a cookie-banner page that has no channelId
      // or player data. Residential IPs usually skip the interstitial.
      cookie: 'CONSENT=YES+1',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return {}
  const html = await res.text()

  // channelId: multiple sites embed it. Try the most stable forms in order.
  let channelId: string | undefined
  for (const re of [
    /"externalChannelId":"(UC[\w-]{20,30})"/,
    /"channelId":"(UC[\w-]{20,30})"/,
    /<meta itemprop="channelId" content="(UC[\w-]{20,30})"/,
  ]) {
    const m = html.match(re)
    if (m) {
      channelId = m[1]
      break
    }
  }

  if (!channelId) {
    const titleMatch = html.match(/<title>([^<]{0,200})<\/title>/)
    console.warn(
      '[yt:scrape-fail] channelId not found',
      JSON.stringify({
        url: watchUrl,
        status: res.status,
        length: html.length,
        title: titleMatch?.[1] ?? null,
        snippet: html.slice(0, 500),
      })
    )
  }

  // description: YouTube moved this out of the player response (which now
  // needs a PoToken). It still lives in ytInitialData under
  // `attributedDescriptionBodyText.content`. JSON-escaped string — wrap in
  // quotes and JSON.parse to decode the \n, \", \uXXXX sequences.
  let description: string | undefined
  const descMatch = html.match(
    /"attributedDescriptionBodyText"\s*:\s*\{\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"/
  )
  if (descMatch) {
    try {
      const decoded = JSON.parse('"' + descMatch[1] + '"') as string
      const trimmed = decoded.trim()
      if (trimmed) description = trimmed.slice(0, 6000)
    } catch {
      // malformed escape sequence — skip
    }
  }

  return { channelId, description }
}
