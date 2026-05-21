import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      // Full-bleed — iOS applies its own rounded-rect clip
      <div
        style={{
          width: 180,
          height: 180,
          background: 'linear-gradient(145deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 28,
          gap: 14,
        }}
      >
        {/* Short bar */}
        <div style={{ width: 32, height: 44,  borderRadius: 8, background: 'rgba(255,255,255,0.65)' }} />
        {/* Medium bar */}
        <div style={{ width: 32, height: 78,  borderRadius: 8, background: 'rgba(255,255,255,0.82)' }} />
        {/* Tall bar */}
        <div style={{ width: 32, height: 114, borderRadius: 8, background: 'rgba(255,255,255,1.00)' }} />
      </div>
    ),
    { ...size },
  )
}
