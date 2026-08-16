'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'

export default function ProfilePage() {
  const supabase = createClient()
  const { profile, loading, refresh } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  if (!initialized && profile) {
    setDisplayName(profile.display_name)
    setInitialized(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', profile.id)
    await refresh()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAvatar(file: File | undefined) {
    if (!file || !profile) return
    setAvatarError('')
    if (!file.type.startsWith('image/')) { setAvatarError('Please choose an image file.'); return }
    setAvatarSaving(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${profile.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('profile-avatars').upload(path, file, { upsert: true })
    if (uploadError) {
      setAvatarError(uploadError.message)
      setAvatarSaving(false)
      return
    }
    const { data } = supabase.storage.from('profile-avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: `${data.publicUrl}?v=${Date.now()}` }).eq('id', profile.id)
    await refresh()
    setAvatarSaving(false)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMessage('')
    if (password.length < 6) { setPasswordMessage('Please choose a password of at least 6 characters.'); return }
    if (password !== confirmPassword) { setPasswordMessage('The two passwords do not match.'); return }
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setPasswordMessage(error.message)
    else { setPassword(''); setConfirmPassword(''); setPasswordMessage('✅ Your personal password has been saved.') }
    setPasswordSaving(false)
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!profile) return <div className="text-center py-12">Not signed in</div>

  const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'

  return (
    <div className="max-w-lg mx-auto space-y-7">
      <div><h1 className="text-2xl font-bold">👤 Your Profile</h1><p className="text-sm text-[var(--text-secondary)] mt-1">Your member information and sign-in settings.</p></div>

      <div className="botanical-card p-5">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="Your avatar" className="w-20 h-20 rounded-full object-cover border border-[var(--border)]" /> : <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-2xl">👤</div>}
          <div><p className="font-semibold">Profile photo</p><label className="inline-block mt-2 px-3 py-1.5 text-sm border border-[var(--primary)] text-[var(--primary)] rounded-lg cursor-pointer hover:bg-[var(--primary)] hover:text-white">{avatarSaving ? 'Uploading...' : 'Choose photo'}<input type="file" accept="image/*" className="hidden" disabled={avatarSaving} onChange={e => handleAvatar(e.target.files?.[0])} /></label>{avatarError && <p className="text-xs text-red-500 mt-2">{avatarError}</p>}</div>
        </div>
      </div>

      <form onSubmit={handleSave} className="botanical-card p-5 space-y-4">
        <h2 className="font-semibold">Member details</h2>
        <div><label className="block text-sm font-medium mb-1">Email</label><div className="px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-sm">{profile.email}</div></div>
        <div><label className="block text-sm font-medium mb-1">Display Name</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} maxLength={100} /></div>
        <button type="submit" disabled={saving} className="px-6 py-2.5 btn-botanical disabled:opacity-50">{saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}</button>
      </form>

      <form onSubmit={handlePassword} className="botanical-card p-5 space-y-4">
        <div><h2 className="font-semibold">Personal password</h2><p className="text-sm text-[var(--text-secondary)] mt-1">After your first email-link sign-in, create a password so you can sign in more easily next time.</p></div>
        {passwordMessage && <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-sm">{passwordMessage}</div>}
        <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} minLength={6} autoComplete="new-password" /></div>
        <div><label className="block text-sm font-medium mb-1">Confirm password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} minLength={6} autoComplete="new-password" /></div>
        <button type="submit" disabled={passwordSaving} className="px-6 py-2.5 btn-botanical disabled:opacity-50">{passwordSaving ? 'Saving...' : 'Save Personal Password'}</button>
      </form>

      <div className="text-xs text-[var(--text-secondary)]">Member since {new Date(profile.created_at).toLocaleDateString()}{profile.is_admin && <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Admin</span>}</div>
    </div>
  )
}
