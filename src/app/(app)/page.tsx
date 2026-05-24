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
        .select('*, profiles(*), categories(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)
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
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ''} 👋
        </h1>
        <p className="text-[var(--text-secondary)]">Your private KURIYA Friends</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="rounded-xl border border-[var(--border)] p-5">
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
                  className="block p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{l.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {l.categories?.name} · by {l.profiles?.display_name}
                      </p>
                    </div>
                    {l.price && (
                      <span className="text-sm font-semibold text-[var(--accent)]">{l.price}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Discussions */}
        <div className="rounded-xl border border-[var(--border)] p-5">
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
          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-medium"
        >
          + New Listing
        </Link>
        <Link
          href="/discussions/new"
          className="px-5 py-2.5 border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors font-medium"
        >
          + New Discussion
        </Link>
      </div>
    </div>
  )
}
