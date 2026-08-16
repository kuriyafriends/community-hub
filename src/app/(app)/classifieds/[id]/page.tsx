'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Listing } from '@/lib/types'
import { classifiedSections, avatarInitials } from '@/lib/classified-config'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [contactVisible, setContactVisible] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('listings')
        .select('*, profiles(*), categories(*), listing_images(*)')
        .eq('id', id)
        .single()
      setListing(data)
      setLoading(false)
    }
    load()
  }, [id])

  async function deleteListing() {
    if (!confirm('Delete this listing?')) return
    await supabase.from('listings').delete().eq('id', id)
    router.push('/classifieds')
  }

  async function markStatus(status: 'sold' | 'closed') {
    await supabase.from('listings').update({ status }).eq('id', id)
    setListing(prev => prev ? { ...prev, status } : null)
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!listing) return <div className="text-center py-12">Listing not found</div>

  const categoryName = listing.categories?.name || ''
  const section = classifiedSections.find(s => s.categoryNames.includes(categoryName)) || classifiedSections.find(s => s.slug === 'other-services')!
  const isOwner = profile?.id === listing.user_id
  const isAdmin = profile?.is_admin
  const photos = (listing.listing_images || []).slice().sort((a, b) => a.sort_order - b.sort_order).slice(0, 4)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-sm text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--primary)]">HOME</Link> <span>›</span>{' '}
        <Link href={`/classifieds/category/${section.slug}`} className="hover:text-[var(--primary)]">{section.breadcrumb}</Link> <span>›</span>{' '}
        <span>Ref. {listing.reference_code || '—'}</span>
      </div>

      <div className="text-center">
        <p className="text-sm text-[var(--text-secondary)]">KURIYA FRIENDS</p>
        <p className="text-[var(--text-secondary)] mt-1">Welcome to...</p>
        <h1 className="text-3xl font-bold mt-1">{listing.title}</h1>
      </div>

      {section.showPhotos && photos.length > 0 && (
        <div className="space-y-2">
          <img src={photos[0].image_url} alt={listing.title} className="w-full max-h-[430px] object-cover rounded-xl" />
          {photos.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(1).map(img => <img key={img.id} src={img.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />)}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {listing.reference_code && <span className="px-3 py-1 rounded-full bg-[var(--primary)] text-white text-sm font-semibold">Ref. {listing.reference_code}</span>}
            {section.showDate && <span className="text-sm text-[var(--text-secondary)]">Date: {new Date(listing.created_at).toLocaleDateString()}</span>}
            {listing.status !== 'active' && <span className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-sm uppercase">{listing.status}</span>}
          </div>

          <div className="botanical-card p-5">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-6">{listing.description || '—'}</p>
          </div>

          {listing.price && section.showPrice && (
            <div className="text-xl font-semibold">Price: <span className="text-[var(--accent-warm)]">{listing.price}</span></div>
          )}
          {listing.location && <div className="text-sm text-[var(--text-secondary)]">📍 {listing.location}</div>}
        </div>

        <div className="botanical-card p-4 md:w-56">
          <div className="flex items-center gap-3">
            {listing.profiles?.avatar_url ? (
              <img src={listing.profiles.avatar_url} alt={listing.profiles.display_name || 'Member'} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center font-semibold text-[var(--primary)]">
                {avatarInitials(listing.profiles?.display_name)}
              </div>
            )}
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Posted by</p>
              <p className="font-medium">{listing.profiles?.display_name || 'Member'}</p>
            </div>
          </div>

          {section.showContact && listing.contact_info && (
            <div className="mt-4">
              {!contactVisible ? (
                <button onClick={() => setContactVisible(true)} className="w-full py-2.5 btn-botanical">Contact</button>
              ) : (
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-sm break-words">{listing.contact_info}</div>
              )}
            </div>
          )}
          {!section.showContact && <p className="mt-4 text-xs text-[var(--text-secondary)]">For questions, please use the forum.</p>}
        </div>
      </div>

      {(isOwner || isAdmin) && listing.status === 'active' && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-5">
          {isOwner && <>
            <button onClick={() => markStatus('sold')} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg">Mark Sold</button>
            <button onClick={() => markStatus('closed')} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg">Close</button>
          </>}
          <button onClick={deleteListing} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg">Delete</button>
        </div>
      )}

      <footer className="border-t border-[var(--border)] pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[var(--text-secondary)]">
        <Link href="/" className="hover:text-[var(--primary)]">About KURIYA Friends</Link>
        <Link href="/" className="hover:text-[var(--primary)]">Contact Us</Link>
        <Link href="/" className="hover:text-[var(--primary)]">Membership & Guidelines</Link>
        <span className="font-semibold text-[var(--primary)]">KURIYA FRIENDS</span>
      </footer>
    </div>
  )
}
