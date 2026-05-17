/**
 * Batch seed: run a list of YouTube URLs through the full pipeline.
 * Sequential so we don't stampede Gemini's rate limits.
 *
 *   npm run seed:batch
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { ingestUrl } from '../lib/pipeline'

const URLS = [
  // Diverse Mark Wiens content under 60min to avoid Gemini sync timeout
  'https://www.youtube.com/watch?v=W8hZkXkh2EA', // India 100K kitchen
  'https://www.youtube.com/watch?v=nUsMFsGuwg0', // America cafeteria
  'https://www.youtube.com/watch?v=3n227UzYczY', // Texas BBQ Houston
  'https://www.youtube.com/watch?v=z8xAEa_IiFI', // New Orleans crawfish
  'https://www.youtube.com/watch?v=XmMoGRI0k2c', // Delhi Ramadan
  'https://www.youtube.com/watch?v=ixEO35xI1vM', // America steakhouse
  'https://www.youtube.com/watch?v=9gk20_u6Cjg', // Kurdish Kurdistan
  'https://www.youtube.com/watch?v=JjB5hi26MS8', // Italy
  'https://www.youtube.com/watch?v=jM80u2ZtkI8', // Cape Town
  'https://www.youtube.com/watch?v=FNs3OjCK95Q', // Korean BBQ
  'https://www.youtube.com/watch?v=NER60w9HiuA', // Original butter chicken
  'https://www.youtube.com/watch?v=7dYaVC-5LmE', // Japan Takayama wagyu
  'https://www.youtube.com/watch?v=Yg4KgRqoTEk', // Singapore fish head curry
  'https://www.youtube.com/watch?v=YFJ8Ag_DCd0', // Oslo Norway
]

async function main() {
  let totalRestaurants = 0
  let totalMentions = 0
  let totalSkipped = 0
  let failures = 0

  for (let i = 0; i < URLS.length; i++) {
    const url = URLS[i]
    const t0 = Date.now()
    console.log(`\n[${i + 1}/${URLS.length}] ${url}`)
    try {
      const r = await ingestUrl(url)
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
      totalRestaurants += r.restaurantsAdded
      totalMentions += r.mentionsAdded
      totalSkipped += r.skippedNoGeocode
      console.log(
        `  ✓ ${elapsed}s · ${r.restaurantsAdded} restaurants, ${r.mentionsAdded} mentions, ${r.skippedNoGeocode} skipped`
      )
    } catch (err) {
      failures++
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ ${elapsed}s · ${msg.slice(0, 200)}`)
    }
  }

  console.log('\n=== Done ===')
  console.log(`  videos:       ${URLS.length}`)
  console.log(`  failures:     ${failures}`)
  console.log(`  restaurants:  ${totalRestaurants}`)
  console.log(`  mentions:     ${totalMentions}`)
  console.log(`  skipped geo:  ${totalSkipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
