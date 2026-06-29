import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const w = parseInt(searchParams.get('w') ?? '1170')
  const h = parseInt(searchParams.get('h') ?? '2532')

  return new ImageResponse(
    (
      <div
        style={{
          width: w,
          height: h,
          background: 'linear-gradient(145deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        {/* Icon — three bars, same as apple-icon.tsx */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ width: 22, height: 30,  borderRadius: 6, background: 'rgba(255,255,255,0.65)' }} />
          <div style={{ width: 22, height: 54,  borderRadius: 6, background: 'rgba(255,255,255,0.82)' }} />
          <div style={{ width: 22, height: 78,  borderRadius: 6, background: 'rgba(255,255,255,1.00)' }} />
        </div>
        {/* App name */}
        <div
          style={{
            color: 'white',
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: '-0.5px',
          }}
        >
          Ledger
        </div>
      </div>
    ),
    { width: w, height: h },
  )
}
