'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'magic' | 'password'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('magic')
  const [sent, setSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function checkWhitelist() {
    const normalizedEmail = email.trim().toLowerCase()
    const { data: whitelisted } = await supabase
      .from('email_whitelist')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (!whitelisted) {
      setError('Sorry, this email is not on the invite list. Contact the admin to get access.')
      return false
    }
    return true
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setSent(false)
    setResetSent(false)

    if (!(await checkWhitelist())) {
      setLoading(false)
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (mode === 'password') {
      if (!password) {
        setError('Please enter your password.')
        setLoading(false)
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (authError) {
        setError('The email or password is incorrect. If you have not created a password yet, use the magic link.')
        setLoading(false)
        return
      }

      window.location.href = '/'
      return
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setError('')
    setResetSent(false)
    if (!email.trim()) {
      setError('Please enter your email address first.')
      return
    }

    setLoading(true)
    if (!(await checkWhitelist())) {
      setLoading(false)
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    )

    if (resetError) {
      setError(resetError.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <svg className="mx-auto mb-4 opacity-30" width="40" height="40" viewBox="0 0 120 130" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M60 125 L60 68" fill="none"/><path d="M60 68 C58 55 52 35 42 18 C40 14 38 10 40 8 C42 6 46 10 48 14 C54 28 58 50 60 68Z"/><path d="M60 68 C55 58 42 42 28 30 C24 27 20 24 18 26 C16 28 20 32 24 35 C38 46 54 58 60 68Z"/><path d="M60 68 C65 58 78 42 92 30 C96 27 100 24 102 26 C104 28 100 32 96 35 C82 46 66 58 60 68Z"/><path d="M60 68 C62 55 68 35 78 18 C80 14 82 10 80 8 C78 6 74 10 72 14 C66 28 62 50 60 68Z"/><path d="M60 68 C56 60 44 50 30 45 C26 44 21 43 20 45 C19 47 23 49 27 50 C42 54 56 62 60 68Z"/></svg>
          <h1 className="text-3xl font-bold mb-2 header-accent" style={{ fontFamily: 'var(--font-heading)' }}>KURIYA Friends</h1>
          <p className="text-[var(--text-secondary)]">Private community — invite only</p>
          <div className="leaf-divider mt-4"><span>🍃</span></div>
        </div>

        {sent ? (
          <div className="text-center p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-4xl mb-3">📧</p>
            <p className="font-medium">Check your email!</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <button type="button" onClick={() => setSent(false)} className="mt-4 text-sm underline">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {resetSent && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                Check your email for a password-reset link.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[var(--bg-secondary)]">
              <button
                type="button"
                onClick={() => { setMode('magic'); setError(''); setResetSent(false) }}
                className={`py-2 rounded-md text-sm font-medium ${mode === 'magic' ? 'bg-[var(--bg)] shadow-sm' : ''}`}
              >
                Email link
              </button>
              <button
                type="button"
                onClick={() => { setMode('password'); setError(''); setResetSent(false) }}
                className={`py-2 rounded-md text-sm font-medium ${mode === 'password' ? 'bg-[var(--bg)] shadow-sm' : ''}`}
              >
                Password
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="you@example.com"
                required
              />
            </div>

            {mode === 'password' && (
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  autoComplete="current-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn-botanical disabled:opacity-50"
            >
              {loading ? 'Checking...' : mode === 'magic' ? 'Send me a magic link' : 'Sign in with password'}
            </button>

            {mode === 'password' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-sm text-[var(--primary)] hover:underline disabled:opacity-50"
              >
                Forgot your password? Email me a verification link
              </button>
            )}

            <p className="text-xs text-center text-[var(--text-secondary)]">
              You need an invite to join. After your first email-link sign-in, you can create a personal password in your Profile.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
