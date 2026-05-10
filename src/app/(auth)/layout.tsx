// Auth pages are fully dynamic — they need live session checks
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
