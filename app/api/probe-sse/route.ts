/**
 * Probe: does Next.js Node runtime flush SSE chunks promptly?
 * Emits 5 events spaced 1s apart. The client should see them in real time,
 * not bunched at the end.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 1; i <= 5; i++) {
        const payload = { i, ts: Date.now() }
        controller.enqueue(encoder.encode(`event: tick\ndata: ${JSON.stringify(payload)}\n\n`))
        await new Promise((r) => setTimeout(r, 1000))
      }
      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
