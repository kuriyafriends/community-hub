'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/lib/types'
import { classifiedSections, getClassifiedSection, avatarInitials } from '@/lib/classified-config'

function Avatar({ name, url }: { name?: string | null; url?: string | null }) {
  return url ? (
    <img src={url} alt={name || 'Member'} className="w-9 h-9 rounded-full object-cover border border-[var(--border)]" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--primary)]">{avatarInitials(name)}</div>
  )
}

export default function ClassifiedCategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const section = getClassifiedSection(slug)
  const supabase = createClient()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!section || section.slug === 'housing') { setLoading(false); return }

      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('name', section.categoryNames)

      const categoryIds = (categories || []).map(c => c.id)
      if (categoryIds.length === 0) { setListings([]); setLoading(false); return }

      const { data } = await supabase
        .from('listings')
        .select('*, profiles(*), categories(*), listing_images(*)')
        .in('category_id', categoryIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setListings(data || [])
      setLoading(false)
    }
    load()
  }, [slug])

  if (!section) return <div className="text-center py-12">Page not found</div>

  if (section.slug === 'housing') {
    const housingSections = classifiedSections.filter(s => s.slug === 'housing-offer' || s.slug === 'housing-wanted')
    return (
      <div className="space-y-6">
        <Breadcrumb label="Housing" />
        <CategoryHero section={section} />
        <div className="grid md:grid-cols-2 gap-6">
          {housingSections.map(item => (
            <Link key={item.slug} href={`/classifieds/category/${item.slug}`} className="botanical-card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-44 flex items-center justify-center bg-[var(--bg-secondary)] text-7xl">{item.emoji}</div>
              <div className="p-5"><h2 className="text-xl font-semibold">{item.label}</h2><p className="text-sm text-[var(--text-secondary)] mt-1">View {item.label.toLowerCase()} posts →</p></div>
            </Link>
          ))}
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb label={section.breadcrumb} />
      <CategoryHero section={section} />
      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="botanical-card p-10 text-center text-[var(--text-secondary)]"><p className="text-4xl mb-3">{section.emoji}</p><p>No posts yet.</p></div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <Link key={listing.id} href={`/classifieds/${listing.id}`} className="block botanical-card p-4 hover:shadow-md transition-shadow">
              <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                <Avatar name={listing.profiles?.display_name} url={listing.profiles?.avatar_url} />
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">{listing.title}</h2>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>👤 {listing.profiles?.display_name || 'Member'}</span>
                    {section.showDate && <span>📅 {new Date(listing.created_at).toLocaleDateString()}</span>}
                    {listing.reference_code && <span>Ref. {listing.reference_code}</span>}
                  </div>
                </div>
                {listing.price && section.showPrice && <span className="font-semibold text-[var(--accent-warm)] whitespace-nowrap">{listing.price}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
      <SiteFooter />
    </div>
  )
}

function Breadcrumb({ label }: { label: string }) {
  return <div className="text-sm text-[var(--text-secondary)]"><Link href="/" className="hover:text-[var(--primary)]">HOME</Link> <span>›</span> <span className="text-[var(--text)]">{label}</span></div>
}

function CategoryHero({ section }: { section: ReturnType<typeof getClassifiedSection> }) {
  if (!section) return null
  return (
    <div className="botanical-card overflow-hidden">
      <div className="h-48 md:h-56 bg-[var(--bg-secondary)] flex items-center justify-center text-8xl" aria-label={`${section.label} category photo`}>{section.emoji}</div>
      <div className="p-5 text-center"><p className="text-sm text-[var(--text-secondary)]">KURIYA FRIENDS</p><h1 className="text-3xl font-bold mt-1">{section.label}</h1></div>
    </div>
  )
}

function SiteFooter() {
  return <footer className="border-t border-[var(--border)] pt-6 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[var(--text-secondary)]"><Link href="/" className="hover:text-[var(--primary)]">About KURIYA Friends</Link><Link href="/" className="hover:text-[var(--primary)]">Contact Us</Link><Link href="/" className="hover:text-[var(--primary)]">Membership & Guidelines</Link><span className="font-semibold text-[var(--primary)]">KURIYA FRIENDS</span></footer>
}
