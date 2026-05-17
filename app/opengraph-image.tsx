import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Crumb — restaurants from the people you actually trust'

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
            <svg width="38" height="38" viewBox="0 0 24 24">
              <path
                d="M12 3c-3.6 0-6.5 2.9-6.5 6.5 0 4.6 6 11 6.3 11.3.1.1.3.2.2.2s.1-.1.2-.2c.3-.3 6.3-6.7 6.3-11.3C18.5 5.9 15.6 3 12 3Z"
                fill="white"
              />
              <path
                d="M8.5 9.3c0 .9 1.6 1.6 3.5 1.6s3.5-.7 3.5-1.6"
                stroke="#DA3F2A"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
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
            Crumb
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
          <div>crumb-vert.vercel.app</div>
          <div>open source · agpl v3</div>
        </div>
      </div>
    ),
    size
  )
}
