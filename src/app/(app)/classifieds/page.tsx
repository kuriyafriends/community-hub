'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Listing, Category } from '@/lib/types'

export default function ClassifiedsPage() {
  const supabase = createClient()
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'classified')
        .order('sort_order')
      setCategories(cats || [])

      let q = supabase
        .from('listings')
        .select('*, profiles(*), categories(*), listing_images(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const { data } = await q
      setListings(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = listings.filter(l => {
    const matchCat = selectedCat === 'all' || l.category_id === selectedCat
    const matchSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">🏷️ Classifieds</h1>
        <Link
          href="/classifieds/new"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
        >
          + New Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <p className="text-4xl mb-3">📭</p>
          <p>No listings found. {search || selectedCat !== 'all' ? 'Try different filters.' : 'Be the first to post!'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => (
            <Link
              key={l.id}
              href={`/classifieds/${l.id}`}
              className="border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {l.listing_images && l.listing_images.length > 0 ? (
                <img
                  src={l.listing_images[0].image_url}
                  alt={l.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-[var(--bg-secondary)] flex items-center justify-center text-4xl">
                  📦
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm line-clamp-1">{l.title}</h3>
                  {l.price && (
                    <span className="text-sm font-bold text-[var(--accent)] ml-2 whitespace-nowrap">{l.price}</span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">{l.description}</p>
                <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)]">{l.categories?.name}</span>
                  <span>{l.profiles?.display_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
