import type { Metadata, Viewport } from 'next'
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeScript } from '@/components/theme-script'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz'],
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Ledger — Personal Finance Tracker',
  description: 'Track your expenses with the 50/30/20 budgeting rule.',
  themeColor: '#2563EB',
  appleWebApp: {
    capable: true,
    title: 'Ledger',
    statusBarStyle: 'black-translucent',
    startupImage: [
      // iPhone 16 Pro Max / 15 Pro Max / 14 Pro Max — 1320×2868 / 1290×2796
      { url: '/api/splash?w=1320&h=2868', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/api/splash?w=1290&h=2796', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 16 Pro / 15 Pro / 14 Pro — 1206×2622 / 1179×2556
      { url: '/api/splash?w=1206&h=2622', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/api/splash?w=1179&h=2556', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 16 Plus / 15 Plus / 14 Plus — 1284×2778
      { url: '/api/splash?w=1284&h=2778', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 16 / 15 / 14 / 13 — 1170×2532
      { url: '/api/splash?w=1170&h=2532', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 13 mini / 12 mini / SE 3rd-gen portrait — 1080×2340 / 750×1334
      { url: '/api/splash?w=1080&h=2340', media: '(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3)' },
      { url: '/api/splash?w=750&h=1334',  media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
      // iPhone 11 Pro Max / XS Max — 1242×2688
      { url: '/api/splash?w=1242&h=2688', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 11 / XR — 828×1792
      { url: '/api/splash?w=828&h=1792',  media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--bg)] text-[var(--ink)]">
        <ThemeScript />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--elevated)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              fontFamily: 'var(--font-hanken)',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
