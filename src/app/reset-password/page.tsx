'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function prepare() {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) setReady(Boolean(session))
    }

    prepare()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && (event === 'PASSWORD_RECOVERY' || session)) {
        setReady(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Please choose a password of at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('The two passwords do not match.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    await supabase.auth.signOut()
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-3">
          <h1 className="text-2xl font-bold header-accent">Set a new password</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            This password-reset link is not active. Please request a new one from the login page.
          </p>
          <a href="/login" className="inline-block text-sm underline text-[var(--primary)]">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-4xl">✅</p>
          <h1 className="text-2xl font-bold header-accent">Password changed</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Your new password has been saved. Please sign in again with it.
          </p>
          <a href="/login" className="inline-block px-6 py-3 btn-botanical">
            Go to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 header-accent">Set a new password</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Choose the password you want to use for KURIYA Friends.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 btn-botanical disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
