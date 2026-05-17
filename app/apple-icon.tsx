import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#DA3F2A',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24">
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
    ),
    size
  )
}
