/**
 * Probe: does Gemini streamGenerateContent actually stream the response
 * during video processing? Or does it buffer everything and dump at the end?
 *
 * What I want to learn:
 *   1. How long until the first byte arrives
 *   2. Cadence of subsequent chunks (smooth or bursty)
 *   3. Total time vs streaming time
 *   4. Raw chunk shape (so I know what to parse)
 *
 * Cost: one Gemini call (~$0.05-0.10 on Flash for a ~25 min video).
 * Worth verifying before architecting the whole streaming pipeline around it.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

const VIDEO_URL = 'https://www.youtube.com/watch?v=z-iAddtjM7A' // Garlic Crab Mountain — ~28 min, known working

const SYSTEM_PROMPT = `You extract restaurant recommendations from food content.

Return a JSON object with one key "restaurants" containing an array of restaurants found in the video. Each restaurant has:
  - name (string)
  - city (string)
  - country (ISO-2)
  - dish (string, what was eaten)
  - quote (string, verbatim from the video)
  - timestampSec (number, only if highly confident)

Output strict JSON, no markdown.`

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const body = {
    contents: [
      {
        parts: [
          { file_data: { mime_type: 'video/*', file_uri: VIDEO_URL } },
          { text: SYSTEM_PROMPT + '\n\nWatch the video. Find every restaurant.' },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      mediaResolution: 'MEDIA_RESOLUTION_LOW',
    },
  }

  const t0 = Date.now()
  console.log(`[${t0}] starting stream call against ${VIDEO_URL}`)

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(600_000),
    }
  )

  if (!res.ok) {
    const txt = await res.text()
    console.error(`http ${res.status}: ${txt.slice(0, 500)}`)
    process.exit(1)
  }

  if (!res.body) {
    console.error('no body')
    process.exit(1)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let chunkN = 0
  let totalBytes = 0
  let firstByteAt: number | null = null
  let lastChunkAt = t0
  let accumulatedText = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const now = Date.now()
    if (firstByteAt === null) {
      firstByteAt = now
      console.log(`[+${((now - t0) / 1000).toFixed(1)}s] FIRST BYTE — ${value.byteLength} bytes`)
    }
    chunkN++
    totalBytes += value.byteLength
    const sinceLast = now - lastChunkAt
    lastChunkAt = now
    const text = decoder.decode(value, { stream: true })

    // Extract the text content from each SSE chunk (data: {json})
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue
      try {
        const obj = JSON.parse(line.slice(6))
        const part = obj?.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof part === 'string') accumulatedText += part
      } catch {
        // ignore
      }
    }

    console.log(
      `[+${((now - t0) / 1000).toFixed(1)}s] chunk #${chunkN}  ${value.byteLength}b  Δ${sinceLast}ms  acc.text=${accumulatedText.length}b`
    )
    // Print the latest snippet so we can see partial JSON
    const tail = accumulatedText.slice(-80).replace(/\s+/g, ' ')
    console.log(`    …${tail}`)
  }

  const tEnd = Date.now()
  console.log(`\n=== summary ===`)
  console.log(`first byte:    +${(((firstByteAt ?? tEnd) - t0) / 1000).toFixed(1)}s`)
  console.log(`total time:    +${((tEnd - t0) / 1000).toFixed(1)}s`)
  console.log(`chunks:        ${chunkN}`)
  console.log(`total bytes:   ${totalBytes}`)
  console.log(`accumulated:   ${accumulatedText.length} chars`)
  console.log(`\nfirst 200 chars of accumulated text:`)
  console.log(accumulatedText.slice(0, 200))
  console.log(`\nlast 200 chars:`)
  console.log(accumulatedText.slice(-200))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
