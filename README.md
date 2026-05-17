# Crumb

A community map of restaurants recommended by food creators. Drop a YouTube
link, an Eater list, a Reddit thread — anything with restaurants in it — and
the AI watches/reads it and drops pins on the map with verbatim quotes and
timestamps linking back to the source.

Live: **[crumb-vert.vercel.app](https://crumb-vert.vercel.app)**

Built so I'd stop forgetting where Mark Wiens told me to eat.

## How it works

```
URL → URL classifier (YouTube / Reddit / article / TikTok)
    → fetcher (Gemini direct URL for video, Readability for articles, JSON for Reddit)
    → extractor (Gemini 2.5 Flash for video, Claude Haiku 4.5 for text)
    → quote validator (drops hallucinated restaurants — quote must be in source)
    → geocoder (Google Places Text Search, Postgres-cached)
    → upsert (Supabase, dedupe by name + city)
```

For long-form YouTube videos, `mediaResolution=LOW` keeps token counts under
Gemini Flash's 1M context. Videos >1 hour synchronous still hit Google's 270s
edge timeout — chunking via `startOffset`/`endOffset` is the v1.5 fix.

## Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, MapLibre GL
- **Database**: Supabase Postgres (pg_trgm for fuzzy name dedup)
- **Extraction**: Gemini 2.5 Flash (video, direct YouTube URL ingestion),
  Claude Haiku 4.5 (text)
- **Geocoding**: Google Places API (New)
- **Hosting**: Vercel
- **Tiles**: Carto Voyager (free OSM tiles)

## Running locally

```bash
git clone https://github.com/OvergrownBaby/crumb
cd crumb
npm install
cp .env.example .env.local  # then fill in keys
npm run dev
```

`.env.local` needs:

```
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_PLACES_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_USE_MOCK_DATA=false
```

Smoke-test a single URL through the pipeline:

```bash
npm run seed:one -- https://www.youtube.com/watch?v=z-iAddtjM7A
```

## Status

- ✅ End-to-end pipeline working for short/medium videos and text sources
- ✅ Every pin has a verbatim quote from the source — no hallucinated restaurants
- ✅ Supabase + Vercel deploy with secret rotation
- ⚠️ Videos >1h hit Gemini's sync timeout; chunking is the fix (TODO)
- ⚠️ TikTok / Instagram Reels not yet supported (needs yt-dlp + proxies)
- ⚠️ Browser-extension flow for one-click YouTube saves not yet built

## License

MIT. No tracking, no ads, no subscription.

If you're a creator and want a pin removed or your channel claimed,
[open an issue](https://github.com/OvergrownBaby/crumb/issues).
