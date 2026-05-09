'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'

export default function ProfilePage() {
  const supabase = createClient()
  const { profile, loading, refresh } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (!initialized && profile) {
    setDisplayName(profile.display_name)
    setInitialized(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id)
    await refresh()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!profile) return <div className="text-center py-12">Not signed in</div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">👤 Your Profile</h1>

      <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
        <p className="text-sm text-[var(--text-secondary)]">Email</p>
        <p className="font-medium">{profile.email}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            maxLength={100}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </form>

      <div className="text-xs text-[var(--text-secondary)]">
        Member since {new Date(profile.created_at).toLocaleDateString()}
        {profile.is_admin && <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Admin</span>}
      </div>
    </div>
  )
}
