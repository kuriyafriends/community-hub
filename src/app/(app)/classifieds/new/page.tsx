'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Category } from '@/lib/types'

export default function NewListingPage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile } = useProfile()
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('type', 'classified')
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
    setError('')

    try {
      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: profile.id,
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          price: price.trim() || null,
          location: location.trim() || null,
          contact_info: contactInfo.trim() || null,
        })
        .select()
        .single()

      if (listingError) throw listingError

      // Upload images
      for (let i = 0; i < Math.min(images.length, 4); i++) {
        const file = images[i]
        const ext = file.name.split('.').pop()
        const path = `${profile.id}/${listing.id}/${i}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(path, file)

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(path)

          await supabase.from('listing_images').insert({
            listing_id: listing.id,
            image_url: urlData.publicUrl,
            sort_order: i,
          })
        }
      }

      router.push(`/classifieds/${listing.id}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="What are you listing?" maxLength={200} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} min-h-[120px]`} placeholder="Add details..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input type="text" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} placeholder="e.g. $50 or Free" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="e.g. Paris, Tokyo" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contact info</label>
          <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className={inputClass} placeholder="How should people reach you?" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Photos (up to 4)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setImages(Array.from(e.target.files || []).slice(0, 4))}
            className="text-sm"
          />
          {images.length > 0 && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">{images.length} photo(s) selected</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-medium disabled:opacity-50"
        >
          {submitting ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  )
}
