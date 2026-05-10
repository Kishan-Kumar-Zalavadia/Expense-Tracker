'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { signupSchema } from '@/lib/validations'
import { cn } from '@/lib/utils'

type SignupValues = { email: string; password: string; confirmPassword: string }

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupValues) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--ink)] mb-4">
            Ledger<span style={{ color: 'var(--c-want)' }}>.</span>
          </h1>
          <div className="bg-[var(--surface)] border border-[var(--border)] apple-card p-8">
            <div className="w-12 h-12 rounded-full bg-[var(--tint-save)] flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="var(--c-save)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[var(--ink)] mb-2">Check your email</h2>
            <p className="text-sm text-[var(--ink-muted)]">
              We&apos;ve sent a confirmation link to your email. Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm text-[var(--c-primary)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--ink)]">
            Ledger<span style={{ color: 'var(--c-want)' }}>.</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Personal finance, simply tracked.
          </p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] apple-card p-8">
          <h2 className="text-base font-semibold text-[var(--ink)] mb-6">Create account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  'apple-input text-sm',
                  errors.email && 'border-[var(--c-want)]',
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--c-want)]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={cn(
                    'apple-input text-sm pr-10',
                    errors.password && 'border-[var(--c-want)]',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[var(--c-want)]">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                className={cn(
                  'apple-input text-sm',
                  errors.confirmPassword && 'border-[var(--c-want)]',
                )}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-[var(--c-want)]">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full" />
              ) : (
                <>
                  <UserPlus size={14} />
                  Create account
                </>
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[var(--surface)] text-xs text-[var(--ink-subtle)]">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
              bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] text-[var(--ink)]
              hover:bg-[var(--surface-2)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]
              min-h-[44px]"
          >
            {googleLoading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-[var(--ink-subtle)] border-t-transparent rounded-full" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--c-primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
