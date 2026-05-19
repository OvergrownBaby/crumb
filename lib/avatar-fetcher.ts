import { supabaseAdmin } from './supabase-server'

/**
 * Best-effort YouTube channel avatar fetch + store.
 *
 *   1. Hit the channel page and scrape the og:image (a high-res
 *      yt3.googleusercontent.com URL).
 *   2. Download the image bytes.
 *   3. Upload to the `creators` Supabase Storage bucket under <slug>.jpg.
 *   4. Return the public URL.
 *
 * Returns null on any failure — caller must treat avatars as optional.
 *
 * Why proxy through Storage rather than using the YouTube CDN URL directly:
 * those googleusercontent URLs are unstable (the original Mark Wiens avatar
 * 404'd over time). Copying to our bucket guarantees longevity.
 */
export async function fetchAndStoreChannelAvatar(args: {
  channelId: string
  slug: string
}): Promise<string | null> {
  const channelUrl = `https://www.youtube.com/channel/${args.channelId}`

  let html: string
  let status: number
  try {
    const res = await fetch(channelUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        // Bypass YouTube's EU consent interstitial — see scrapeWatchPage notes.
        cookie: 'CONSENT=YES+1',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.warn(
        '[avatar:fetch-fail] channel page non-200',
        JSON.stringify({ channelUrl, status: res.status })
      )
      return null
    }
    status = res.status
    html = await res.text()
  } catch (e) {
    console.warn(
      '[avatar:fetch-fail] channel page fetch threw',
      JSON.stringify({ channelUrl, error: e instanceof Error ? e.message : String(e) })
    )
    return null
  }

  const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
  if (!ogMatch) {
    const titleMatch = html.match(/<title>([^<]{0,200})<\/title>/)
    console.warn(
      '[avatar:fetch-fail] og:image not found on channel page',
      JSON.stringify({
        channelUrl,
        status,
        length: html.length,
        title: titleMatch?.[1] ?? null,
        snippet: html.slice(0, 500),
      })
    )
    return null
  }
  const imageUrl = ogMatch[1]

  let bytes: Uint8Array
  let contentType: string
  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) })
    if (!imgRes.ok) return null
    bytes = new Uint8Array(await imgRes.arrayBuffer())
    contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
  } catch {
    return null
  }

  const sb = supabaseAdmin()
  const ext = contentType.includes('png') ? 'png' : 'jpg'
  const path = `${args.slug}.${ext}`

  const { error } = await sb.storage.from('creators').upload(path, bytes, {
    contentType,
    upsert: true,
  })
  if (error) return null

  const { data } = sb.storage.from('creators').getPublicUrl(path)
  return data.publicUrl
}
