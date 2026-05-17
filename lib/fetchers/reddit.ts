import type { FetchedContent } from './index'

type RedditPost = {
  title?: string
  selftext?: string
  author?: string
  created_utc?: number
  permalink?: string
}
type RedditComment = {
  body?: string
  author?: string
  score?: number
}

/**
 * Reddit's public JSON endpoint — append .json to any thread URL.
 * No auth required for public threads.
 */
export async function fetchReddit(url: string): Promise<FetchedContent> {
  const u = new URL(url)
  // Strip trailing slash, ensure .json
  const jsonUrl = u.origin + u.pathname.replace(/\/$/, '') + '.json'

  const res = await fetch(jsonUrl, {
    headers: {
      // Reddit increasingly demands a non-bot UA
      'User-Agent': 'foodmap/0.1 (open-source food atlas; +https://github.com)',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    throw new Error(`Reddit fetch failed (${res.status}): ${jsonUrl}`)
  }

  const data = (await res.json()) as Array<{
    data: { children: Array<{ data: RedditPost | RedditComment }> }
  }>

  // [0] = post(s), [1] = comments tree (flat-ish)
  const post = data[0]?.data.children[0]?.data as RedditPost | undefined
  if (!post) throw new Error('Reddit response had no post')

  const comments = data[1]?.data.children.map((c) => c.data as RedditComment) ?? []

  // Build text blob: post body + top comments (limit so we don't blow extractor context)
  const parts: string[] = []
  if (post.title) parts.push(`# ${post.title}\n`)
  if (post.selftext) parts.push(post.selftext.trim())
  parts.push('\n## Comments\n')
  let charCount = parts.join('\n').length
  for (const c of comments) {
    if (!c.body || c.body === '[deleted]' || c.body === '[removed]') continue
    const block = `- **${c.author ?? 'anon'}** (${c.score ?? 0} pts): ${c.body.trim()}`
    if (charCount + block.length > 60_000) break // cap at ~15K tokens
    parts.push(block)
    charCount += block.length
  }

  return {
    kind: 'text',
    sourceKind: 'reddit',
    url,
    title: post.title,
    text: parts.join('\n\n'),
    author: post.author,
    publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
  }
}
