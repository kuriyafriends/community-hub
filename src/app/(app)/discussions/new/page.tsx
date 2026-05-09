'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Category } from '@/lib/types'

export default function NewDiscussionPage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile } = useProfile()
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('type', 'discussion')
      .order('sort_order')
      .then(({ data }) => {
        setCategories(data || [])
        if (data && data.length > 0) setCategoryId(data[0].id)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!title.trim()) { setError('Title is required'); return }
    setSubmitting(true)

    const { data, error: err } = await supabase
      .from('discussions')
      .insert({
        user_id: profile.id,
        category_id: categoryId,
        title: title.trim(),
        body: body.trim(),
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setSubmitting(false)
    } else {
      router.push(`/discussions/${data.id}`)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Discussion</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="What do you want to discuss?" maxLength={300} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} className={`${inputClass} min-h-[180px]`} placeholder="Share your thoughts..." />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-medium disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post Discussion'}
        </button>
      </form>
    </div>
  )
}
