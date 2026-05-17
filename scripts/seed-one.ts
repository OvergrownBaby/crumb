/**
 * Smoke-test the full pipeline against one URL.
 *
 *   npm run seed:one -- https://www.youtube.com/watch?v=HWMga1ULQEU
 *
 * Prints what was fetched, extracted, geocoded, and persisted. Failure modes
 * are reported per-step so you can see exactly where the pipeline broke.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { ingestUrl } from '../lib/pipeline'

async function main() {
  const url = process.argv[2]
  if (!url) {
    console.error('Usage: npm run seed:one -- <url>')
    process.exit(1)
  }

  console.log(`\n→ Ingesting: ${url}\n`)
  const t0 = Date.now()
  try {
    const result = await ingestUrl(url)
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    console.log(`\n✓ Done in ${elapsed}s`)
    console.log(`  video_id:       ${result.videoId}`)
    console.log(`  restaurants:    ${result.restaurantsAdded}`)
    console.log(`  mentions:       ${result.mentionsAdded}`)
    console.log(`  no-geocode:     ${result.skippedNoGeocode}`)
  } catch (err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    console.error(`\n✗ Failed after ${elapsed}s`)
    console.error(err)
    process.exit(1)
  }
}

main()
