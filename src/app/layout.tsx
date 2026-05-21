import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Ledger — Personal Finance Tracker',
  description: 'Track your expenses with the 50/30/20 budgeting rule.',
  themeColor: '#2563EB',
  appleWebApp: {
    capable: true,
    title: 'Ledger',
    statusBarStyle: 'black-translucent',
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
          position="bottom-right"
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
