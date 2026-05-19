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
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.48 2 2 6.48 2 12c0 4 2.5 7 6 8.5L12 23l4-2.5c3.5-1.5 6-4.5 6-8.5 0-5.52-4.48-10-10-10Zm0 6a4 4 0 100 8 4 4 0 000-8Z"
          />
        </svg>
      </div>
    ),
    size
  )
}
