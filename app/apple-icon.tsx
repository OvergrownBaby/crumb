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
        <svg width="120" height="120" viewBox="0 0 24 24" fill="white">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.48 2 2 6.48 2 12c0 4 2.5 7 6 8.5L12 23l4-2.5c3.5-1.5 6-4.5 6-8.5 0-5.52-4.48-10-10-10Zm0 5c2 0 3.7 1 4.5 2.6L14 10.7c-.5-.7-1.2-1-2-1-1.4 0-2.5 1-2.5 2.5S10.6 14.7 12 14.7c.8 0 1.5-.3 2-1l2.5 1.1c-.8 1.6-2.5 2.6-4.5 2.6-3 0-5.5-2.5-5.5-5.2C6.5 9.5 9 7 12 7Z"
          />
        </svg>
      </div>
    ),
    size
  )
}
