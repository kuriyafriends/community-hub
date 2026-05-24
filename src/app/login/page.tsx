'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    // Check whitelist first
    const { data: whitelisted } = await supabase
      .from('email_whitelist')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!whitelisted) {
      setError('Sorry, this email is not on the invite list. Contact the admin to get access.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <svg className="mx-auto mb-4 opacity-40" width="36" height="36" viewBox="0 0 100 100" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"><path d="M50 90 L50 45"/><path d="M50 45 C50 25 35 10 25 5"/><path d="M50 45 C45 30 30 20 15 18"/><path d="M50 45 C55 30 70 20 85 18"/><path d="M50 45 C50 25 65 10 75 5"/><path d="M50 45 C42 32 28 28 15 35"/></svg>
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
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn-botanical disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Sign in with Magic Link'}
            </button>

            <p className="text-xs text-center text-[var(--text-secondary)]">
              You need an invite to join. Ask the community admin for access.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

