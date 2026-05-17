import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#DA3F2A',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path
            d="M12 3c-3.6 0-6.5 2.9-6.5 6.5 0 4.6 6 11 6.3 11.3.1.1.3.2.2.2s.1-.1.2-.2c.3-.3 6.3-6.7 6.3-11.3C18.5 5.9 15.6 3 12 3Z"
            fill="white"
          />
        </svg>
      </div>
    ),
    size
  )
}
