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

  return {
    kind: 'video_url',
    sourceKind: 'youtube',
    videoId,
    url: canonical,
    title,
    thumbnailUrl,
    channelName,
  }
}
