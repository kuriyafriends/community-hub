'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Listing, ListingComment } from '@/lib/types'

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile()
  const [listing, setListing] = useState<Listing | null>(null)
  const [comments, setComments] = useState<ListingComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('listings')
        .select('*, profiles(*), categories(*), listing_images(*)')
        .eq('id', id)
        .single()
      setListing(data)

      const { data: cmts } = await supabase
        .from('listing_comments')
        .select('*, profiles(*)')
        .eq('listing_id', id)
        .order('created_at')
      setComments(cmts || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function addComment() {
    if (!newComment.trim() || !profile) return
    const { data, error } = await supabase
      .from('listing_comments')
      .insert({ listing_id: id, user_id: profile.id, content: newComment.trim() })
      .select('*, profiles(*)')
      .single()
    if (!error && data) {
      setComments([...comments, data])
      setNewComment('')
    }
  }

  async function deleteListing() {
    if (!confirm('Delete this listing?')) return
    await supabase.from('listings').delete().eq('id', id)
    router.push('/classifieds')
  }

  async function markStatus(status: 'sold' | 'closed') {
    await supabase.from('listings').update({ status }).eq('id', id)
    setListing(prev => prev ? { ...prev, status } : null)
  }

  async function deleteComment(commentId: string) {
    await supabase.from('listing_comments').delete().eq('id', commentId)
    setComments(comments.filter(c => c.id !== commentId))
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!listing) return <div className="text-center py-12">Listing not found</div>

  const isOwner = profile?.id === listing.user_id
  const isAdmin = profile?.is_admin

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {listing.listing_images && listing.listing_images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {listing.listing_images.map((img, i) => (
            <img
              key={img.id}
              src={img.image_url}
              alt={`${listing.title} ${i + 1}`}
              className={`w-full object-cover ${listing.listing_images!.length === 1 ? 'col-span-2 h-80' : 'h-48'}`}
            />
          ))}
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
                {listing.categories?.name}
              </span>
              {listing.reference_code && (
                <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--primary)] text-white text-xs font-semibold">
                  Ref. {listing.reference_code}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
          </div>
          {listing.price && <span className="text-2xl font-bold text-[var(--accent)]">{listing.price}</span>}
        </div>
        {listing.status !== 'active' && (
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium uppercase">
            {listing.status}
          </span>
        )}
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{listing.description}</div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
        {listing.location && <span>📍 {listing.location}</span>}
        {listing.contact_info && <span>📞 {listing.contact_info}</span>}
        <span>👤 {listing.profiles?.display_name}</span>
        <span>📅 {new Date(listing.created_at).toLocaleDateString()}</span>
      </div>

      {(isOwner || isAdmin) && listing.status === 'active' && (
        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <>
              <button onClick={() => markStatus('sold')} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg">Mark Sold</button>
              <button onClick={() => markStatus('closed')} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg">Close</button>
            </>
          )}
          <button onClick={deleteListing} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg">Delete</button>
        </div>
      )}

      <div className="border-t border-[var(--border)] pt-6">
        <h2 className="text-lg font-semibold mb-4">Comments ({comments.length})</h2>

        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="p-3 rounded-lg bg-[var(--bg-secondary)]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-sm">{c.profiles?.display_name}</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-2">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                {(profile?.id === c.user_id || isAdmin) && (
                  <button onClick={() => deleteComment(c.id)} className="text-xs text-red-500 hover:underline">delete</button>
                )}
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addComment())}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button onClick={addComment} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm">Send</button>
        </div>
      </div>
    </div>
  )
}
