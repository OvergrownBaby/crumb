import { fetchYouTube } from './youtube'
import type { SourceKind } from '@/lib/types'
// Non-YouTube fetchers are temporarily disabled — files kept in this directory
// (./reddit, ./article) for easy re-enable later.

export type FetchedContent =
  | {
      kind: 'video_url'
      sourceKind: 'youtube'
      videoId: string
      url: string
      title?: string
      thumbnailUrl?: string
      publishedAt?: string
      channelName?: string
      channelId?: string
      /** Video description scraped from the watch page. Creators almost
       * always list restaurant names + timestamps here — used as canonical
       * ground-truth so Gemini doesn't phonetically misspell foreign names. */
      description?: string
    }
  | {
      kind: 'text'
      sourceKind: Exclude<SourceKind, 'youtube'>
      url: string
      title?: string
      text: string
      author?: string
      publishedAt?: string
    }

export function classify(url: string): SourceKind | null {
  try {
    const u = new URL(url)
    const h = u.hostname.replace(/^www\./, '')
    if (/youtube\.com|youtu\.be/.test(h)) return 'youtube'
    if (/tiktok\.com/.test(h)) return 'tiktok'
    if (/reddit\.com/.test(h)) return 'reddit'
    if (/maps\.app\.goo\.gl|google\.com\/maps/.test(h)) return 'maps_list'
    return 'article'
  } catch {
    return null
  }
}

export async function fetchUrl(url: string): Promise<FetchedContent> {
  const kind = classify(url)
  if (!kind) throw new Error('Invalid URL')

  if (kind !== 'youtube') {
    throw new Error('Only YouTube links are supported right now. Paste a youtube.com or youtu.be URL.')
  }

  return fetchYouTube(url)
}
