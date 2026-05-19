import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Foodcrawl — restaurants from the people you actually trust'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF6EE',
          backgroundImage:
            'radial-gradient(ellipse at 90% 10%, rgba(242,169,59,0.22), transparent 55%), radial-gradient(ellipse at 5% 95%, rgba(218,63,42,0.10), transparent 55%)',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row: logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: '#DA3F2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(218,63,42,0.35)',
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="white">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.48 2 2 6.48 2 12c0 4 2.5 7 6 8.5L12 23l4-2.5c3.5-1.5 6-4.5 6-8.5 0-5.52-4.48-10-10-10Zm0 6a4 4 0 100 8 4 4 0 000-8Z"
              />
            </svg>
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: '#1A1814',
              letterSpacing: '-1.5px',
            }}
          >
            Foodcrawl
          </div>
        </div>

        {/* Main display copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 980 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: '#1A1814',
              lineHeight: 1.02,
              letterSpacing: '-3px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0 24px',
            }}
          >
            <span>Restaurants</span>
            <span style={{ color: '#DA3F2A' }}>recommended by</span>
            <span>the people you actually trust.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              color: '#6F665A',
              marginTop: 24,
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            Drop any YouTube / TikTok / Reddit / Eater link. The AI watches it,
            pins the places, links the timestamps.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 18,
            color: '#6F665A',
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <div>thefoodcrawl.com</div>
          <div>open source · agpl v3</div>
        </div>
      </div>
    ),
    size
  )
}
