import { fetchReddit } from './reddit'
import { fetchArticle } from './article'
import { fetchYouTube } from './youtube'
import type { SourceKind } from '@/lib/types'

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

  switch (kind) {
    case 'youtube':
      return fetchYouTube(url)
    case 'reddit':
      return fetchReddit(url)
    case 'article':
      return fetchArticle(url)
    case 'tiktok':
      throw new Error('TikTok ingestion is not in v1 (needs yt-dlp + proxies). Try a YouTube link instead.')
    case 'maps_list':
      throw new Error('Google Maps lists are not in v1. Try a YouTube link or blog post.')
    case 'text_paste':
      throw new Error('text_paste should not come through fetchUrl')
  }
}
