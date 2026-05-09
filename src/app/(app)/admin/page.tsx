'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Category, Profile } from '@/lib/types'

type Tab = 'dashboard' | 'whitelist' | 'categories' | 'users'

export default function AdminPage() {
  const supabase = createClient()
  const { profile, loading } = useProfile()
  const [tab, setTab] = useState<Tab>('dashboard')

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!profile?.is_admin) return <div className="text-center py-12 text-red-500">Access denied — admin only</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Admin Panel</h1>

      <div className="flex gap-2 flex-wrap">
        {(['dashboard', 'whitelist', 'categories', 'users'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              tab === t ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'whitelist' && <Whitelist />}
      {tab === 'categories' && <Categories />}
      {tab === 'users' && <Users />}
    </div>
  )
}

function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ users: 0, listings: 0, discussions: 0, whitelisted: 0 })

  useEffect(() => {
    async function load() {
      const [u, l, d, w] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }),
        supabase.from('discussions').select('id', { count: 'exact', head: true }),
        supabase.from('email_whitelist').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        users: u.count || 0,
        listings: l.count || 0,
        discussions: d.count || 0,
        whitelisted: w.count || 0,
      })
    }
    load()
  }, [])

  const cards = [
    { label: 'Users', value: stats.users, icon: '👤' },
    { label: 'Whitelisted Emails', value: stats.whitelisted, icon: '📧' },
    { label: 'Listings', value: stats.listings, icon: '🏷️' },
    { label: 'Discussions', value: stats.discussions, icon: '💬' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="p-4 rounded-xl border border-[var(--border)] text-center">
          <p className="text-3xl mb-1">{c.icon}</p>
          <p className="text-2xl font-bold">{c.value}</p>
          <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

function Whitelist() {
  const supabase = createClient()
  const { profile } = useProfile()
  const [emails, setEmails] = useState<{ id: string; email: string; created_at: string }[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmails()
  }, [])

  async function loadEmails() {
    const { data } = await supabase
      .from('email_whitelist')
      .select('*')
      .order('created_at', { ascending: false })
    setEmails(data || [])
    setLoading(false)
  }

  async function addEmail() {
    if (!newEmail.trim() || !profile) return
    await supabase.from('email_whitelist').insert({ email: newEmail.trim().toLowerCase(), added_by: profile.id })
    setNewEmail('')
    loadEmails()
  }

  async function addBulk() {
    if (!bulkText.trim() || !profile) return
    const emailList = bulkText
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@'))
    const inserts = emailList.map(email => ({ email, added_by: profile.id }))
    await supabase.from('email_whitelist').upsert(inserts, { onConflict: 'email' })
    setBulkText('')
    setShowBulk(false)
    loadEmails()
  }

  async function removeEmail(id: string) {
    await supabase.from('email_whitelist').delete().eq('id', id)
    setEmails(emails.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addEmail()}
          placeholder="Add email address..."
          className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button onClick={addEmail} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm">Add</button>
        <button onClick={() => setShowBulk(!showBulk)} className="px-4 py-2 bg-[var(--bg-secondary)] rounded-lg text-sm">Bulk</button>
      </div>

      {showBulk && (
        <div className="space-y-2">
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder="Paste emails, one per line or comma-separated..."
            className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button onClick={addBulk} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Import All</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {emails.map(e => (
            <div key={e.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
              <span className="text-sm">{e.email}</span>
              <button onClick={() => removeEmail(e.id)} className="text-xs text-red-500 hover:underline">remove</button>
            </div>
          ))}
          <p className="text-xs text-[var(--text-secondary)] pt-2">{emails.length} email(s) whitelisted</p>
        </div>
      )}
    </div>
  )
}

function Categories() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'classified' | 'discussion'>('classified')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadCats() }, [])

  async function loadCats() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('type')
      .order('sort_order')
    setCategories(data || [])
    setLoading(false)
  }

  async function addCategory() {
    if (!newName.trim()) return
    const maxOrder = categories
      .filter(c => c.type === newType)
      .reduce((max, c) => Math.max(max, c.sort_order), 0)
    await supabase.from('categories').insert({ name: newName.trim(), type: newType, sort_order: maxOrder + 1 })
    setNewName('')
    loadCats()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Listings/discussions using it will need to be reassigned.')) return
    await supabase.from('categories').delete().eq('id', id)
    loadCats()
  }

  const classifiedCats = categories.filter(c => c.type === 'classified')
  const discussionCats = categories.filter(c => c.type === 'discussion')

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCategory()}
          placeholder="New category name..."
          className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <select
          value={newType}
          onChange={e => setNewType(e.target.value as 'classified' | 'discussion')}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm"
        >
          <option value="classified">Classified</option>
          <option value="discussion">Discussion</option>
        </select>
        <button onClick={addCategory} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm">Add</button>
      </div>

      {loading ? <p className="text-sm text-[var(--text-secondary)]">Loading...</p> : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">🏷️ Classified Categories</h3>
            <div className="space-y-1">
              {classifiedCats.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                  <span className="text-sm">{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} className="text-xs text-red-500 hover:underline">delete</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">💬 Discussion Categories</h3>
            <div className="space-y-1">
              {discussionCats.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                  <span className="text-sm">{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} className="text-xs text-red-500 hover:underline">delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Users() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function toggleBan(user: Profile) {
    await supabase.from('profiles').update({ is_banned: !user.is_banned }).eq('id', user.id)
    loadUsers()
  }

  return (
    <div>
      {loading ? <p className="text-sm text-[var(--text-secondary)]">Loading...</p> : (
        <div className="space-y-1">
          {users.map(u => (
            <div key={u.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-[var(--bg-secondary)]">
              <div>
                <p className="text-sm font-medium">
                  {u.display_name}
                  {u.is_admin && <span className="ml-1 text-xs text-yellow-600">⭐ admin</span>}
                  {u.is_banned && <span className="ml-1 text-xs text-red-500">🚫 banned</span>}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
              </div>
              {!u.is_admin && (
                <button
                  onClick={() => toggleBan(u)}
                  className={`px-3 py-1 text-xs rounded-lg ${u.is_banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                >
                  {u.is_banned ? 'Unban' : 'Ban'}
                </button>
              )}
            </div>
          ))}
          <p className="text-xs text-[var(--text-secondary)] pt-2">{users.length} user(s)</p>
        </div>
      )}
    </div>
  )
}
