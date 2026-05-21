import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: '#2563EB',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 5,
          gap: 3,
        }}
      >
        <div style={{ width: 6, height: 8,  borderRadius: 2, background: 'rgba(255,255,255,0.70)' }} />
        <div style={{ width: 6, height: 14, borderRadius: 2, background: 'rgba(255,255,255,0.85)' }} />
        <div style={{ width: 6, height: 20, borderRadius: 2, background: 'rgba(255,255,255,1.00)' }} />
      </div>
    ),
    { ...size },
  )
}
