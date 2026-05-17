import type { FetchedContent } from './index'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'

/**
 * Generic article fetcher — fetch HTML, run Mozilla Readability to extract
 * main content. Works on Eater, Infatuation, Time Out, Substack, blogs, etc.
 */
export async function fetchArticle(url: string): Promise<FetchedContent> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) {
    throw new Error(`Article fetch failed (${res.status}): ${url}`)
  }
  const html = await res.text()
  const dom = new JSDOM(html, { url })
  const article = new Readability(dom.window.document).parse()

  if (!article || !article.textContent) {
    throw new Error('Could not extract article content (Readability returned nothing)')
  }

  const text = article.textContent.trim().replace(/\n{3,}/g, '\n\n')

  // Cap at ~50K chars (~12K tokens) — articles longer than that are usually padding.
  const capped = text.length > 50_000 ? text.slice(0, 50_000) : text

  return {
    kind: 'text',
    sourceKind: 'article',
    url,
    title: article.title || undefined,
    text: capped,
    author: article.byline || undefined,
    publishedAt: article.publishedTime || undefined,
  }
}
