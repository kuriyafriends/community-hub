'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Listing, Discussion } from '@/lib/types'

export default function Home() {
  const { profile, loading } = useProfile()
  const [recentListings, setRecentListings] = useState<Listing[]>([])
  const [recentDiscussions, setRecentDiscussions] = useState<Discussion[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: listings } = await supabase
        .from('listings')
        .select('*, profiles(*), categories(*), listing_images(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)
      setRecentListings(listings || [])

      const { data: discussions } = await supabase
        .from('discussions')
        .select('*, profiles(*), categories(*)')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentDiscussions(discussions || [])
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="text-center py-10 relative">
        <svg className="mx-auto mb-3 opacity-30" width="32" height="32" viewBox="0 0 100 100" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"><path d="M50 90 L50 45"/><path d="M50 45 C50 25 35 10 25 5"/><path d="M50 45 C45 30 30 20 15 18"/><path d="M50 45 C55 30 70 20 85 18"/><path d="M50 45 C50 25 65 10 75 5"/><path d="M50 45 C42 32 28 28 15 35"/></svg>
        <h1 className="text-3xl font-bold mb-2 header-accent">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ''} 👋
        </h1>
        <p className="text-[var(--text-secondary)]">Your private community</p>
        <div className="leaf-divider mt-6"><span>🍃</span></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="botanical-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">🏷️ Recent Listings</h2>
            <Link href="/classifieds" className="text-sm text-[var(--primary)] hover:underline">
              View all →
            </Link>
          </div>
          {recentListings.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm">No listings yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {recentListings.map(l => (
                <Link
                  key={l.id}
                  href={`/classifieds/${l.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  {l.listing_images && l.listing_images.length > 0 ? (
                    <img
                      src={l.listing_images[0].image_url}
                      alt={l.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-xl flex-shrink-0">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm truncate">{l.title}</p>
                      {l.price && (
                        <span className="text-sm font-semibold text-[var(--accent-warm)] ml-2 whitespace-nowrap">{l.price}</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {l.categories?.name} · by {l.profiles?.display_name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Discussions */}
        <div className="botanical-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">💬 Recent Discussions</h2>
            <Link href="/discussions" className="text-sm text-[var(--primary)] hover:underline">
              View all →
            </Link>
          </div>
          {recentDiscussions.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm">No discussions yet. Start a topic!</p>
          ) : (
            <div className="space-y-3">
              {recentDiscussions.map(d => (
                <Link
                  key={d.id}
                  href={`/discussions/${d.id}`}
                  className="block p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <p className="font-medium text-sm">
                    {d.is_pinned && '📌 '}{d.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {d.categories?.name} · by {d.profiles?.display_name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Link
          href="/classifieds/new"
          className="btn-botanical px-5 py-2.5"
        >
          🌿 New Listing
        </Link>
        <Link
          href="/discussions/new"
          className="px-5 py-2.5 border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-all font-medium hover:shadow-md"
        >
          💬 New Discussion
        </Link>
      </div>
    </div>
  )
}

