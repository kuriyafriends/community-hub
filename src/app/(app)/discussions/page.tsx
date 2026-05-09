'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Discussion, Category } from '@/lib/types'

export default function DiscussionsPage() {
  const supabase = createClient()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'discussion')
        .order('sort_order')
      setCategories(cats || [])

      const { data } = await supabase
        .from('discussions')
        .select('*, profiles(*), categories(*)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      setDiscussions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = selectedCat === 'all'
    ? discussions
    : discussions.filter(d => d.category_id === selectedCat)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">💬 Discussions</h1>
        <Link
          href="/discussions/new"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
        >
          + New Topic
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 rounded-full text-sm ${selectedCat === 'all' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)]'}`}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${selectedCat === c.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-secondary)]'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <p className="text-4xl mb-3">🗣️</p>
          <p>No discussions yet. Start a topic!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <Link
              key={d.id}
              href={`/discussions/${d.id}`}
              className="block p-4 rounded-xl border border-[var(--border)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">
                    {d.is_pinned && '📌 '}{d.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">{d.body}</p>
                </div>
                <div className="text-right text-xs text-[var(--text-secondary)] shrink-0">
                  <p>{d.profiles?.display_name}</p>
                  <p>{new Date(d.created_at).toLocaleDateString()}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[var(--bg-secondary)]">{d.categories?.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
