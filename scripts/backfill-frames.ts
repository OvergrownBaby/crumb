/**
 * Backfill: for each mention with a YouTube video + timestamp, extract one
 * frame at that timestamp and store it in the Supabase `frames` bucket.
 *
 *   npm run backfill:frames
 *
 * Strategy:
 *   1. yt-dlp -g  → direct stream URL (YouTube range-supports it)
 *   2. ffmpeg -ss → seek + extract one frame as jpeg
 *   3. supabase storage upload
 *   4. update mentions.frame_url
 *
 * Routes through Tor (already-running on :9050) to avoid YouTube's
 * server-IP bot detection.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { spawn } from 'child_process'
import { unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { createConnection } from 'net'
import { supabaseAdmin } from '../lib/supabase-server'

const YTDLP = '/Users/andy/Library/Python/3.13/bin/yt-dlp'
const TOR_PROXY = 'socks5h://127.0.0.1:9050'

function rotateTorCircuit(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = createConnection(9051, '127.0.0.1', () => {
      s.write('AUTHENTICATE ""\r\nSIGNAL NEWNYM\r\nQUIT\r\n')
    })
    s.on('data', () => {})
    s.on('end', () => resolve())
    s.on('error', reject)
    setTimeout(() => {
      s.destroy()
      resolve()
    }, 3000)
  })
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function getStreamUrl(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-f',
      'best[height<=720][ext=mp4]/best[height<=720]/best',
      '-g',
      '--proxy',
      TOR_PROXY,
      '--no-warnings',
      videoUrl,
    ]
    const proc = spawn(YTDLP, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (c) => (stdout += c.toString()))
    proc.stderr.on('data', (c) => (stderr += c.toString()))
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `yt-dlp exit ${code}`))
      const url = stdout.trim().split('\n')[0]
      if (!url) return reject(new Error('no stream url'))
      resolve(url)
    })
  })
}

function extractFrame(streamUrl: string, ts: number, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-ss',
      String(ts),
      '-i',
      streamUrl,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      '-y',
      '-loglevel',
      'error',
      outPath,
    ]
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (c) => (stderr += c.toString()))
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error('ffmpeg timeout'))
    }, 60_000)
    proc.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) reject(new Error(stderr.slice(-300)))
      else resolve()
    })
  })
}

type Row = {
  id: string
  video_id: string
  timestamp_sec: number
  videos: { url: string; source_kind: string }
}

async function main() {
  const sb = supabaseAdmin()

  const { data: raw, error } = await sb
    .from('mentions')
    .select('id, video_id, timestamp_sec, videos!inner(url, source_kind)')
    .is('frame_url', null)
    .not('timestamp_sec', 'is', null)

  if (error) throw error
  const rows = ((raw ?? []) as unknown as Row[]).filter(
    (m) => m.videos.source_kind === 'youtube'
  )
  console.log(`${rows.length} mentions to backfill`)

  // Group by video URL so we only fetch one stream URL per video
  const byVideo = new Map<string, Row[]>()
  for (const m of rows) {
    const url = m.videos.url
    if (!byVideo.has(url)) byVideo.set(url, [])
    byVideo.get(url)!.push(m)
  }

  for (const [videoUrl, batch] of byVideo) {
    console.log(`\n→ ${videoUrl}  (${batch.length} timestamp${batch.length === 1 ? '' : 's'})`)

    // Retry up to 8 times rotating Tor exit on each failure (YouTube blocks
    // most exits but a fresh circuit usually finds an un-flagged one).
    let streamUrl: string | null = null
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        streamUrl = await getStreamUrl(videoUrl)
        console.log(`  got stream url (attempt ${attempt + 1})`)
        break
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const isBlock =
          msg.includes('Sign in to confirm') ||
          msg.includes('not a bot') ||
          msg.includes('cookies') ||
          msg.includes('429') ||
          msg.includes('403') ||
          msg.includes('blocked')
        if (isBlock) {
          console.log(`  attempt ${attempt + 1} blocked, rotating Tor circuit...`)
          await rotateTorCircuit().catch(() => {})
          await sleep(8000)
          continue
        }
        console.error(`  ✗ stream: ${msg.slice(0, 200)}`)
        break
      }
    }
    if (!streamUrl) continue

    for (const m of batch) {
      const ts = m.timestamp_sec
      const outPath = join(tmpdir(), `frame-${m.id}.jpg`)
      try {
        await extractFrame(streamUrl, ts, outPath)
        const bytes = await readFile(outPath)
        const key = `${m.id}.jpg`
        const { error: upErr } = await sb.storage
          .from('frames')
          .upload(key, bytes, { contentType: 'image/jpeg', upsert: true })
        if (upErr) {
          console.error(`  ✗ ${ts}s upload: ${upErr.message}`)
          continue
        }
        const {
          data: { publicUrl },
        } = sb.storage.from('frames').getPublicUrl(key)
        await sb.from('mentions').update({ frame_url: publicUrl }).eq('id', m.id)
        await unlink(outPath).catch(() => {})
        console.log(`  ✓ ${ts}s → ${publicUrl.split('/').pop()}`)
      } catch (e) {
        console.error(`  ✗ ${ts}s frame: ${e instanceof Error ? e.message.slice(0, 200) : e}`)
      }
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
