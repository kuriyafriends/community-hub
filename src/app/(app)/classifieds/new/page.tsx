'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks'
import type { Category } from '@/lib/types'
import { classifiedSections } from '@/lib/classified-config'

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
    supabase.from('categories').select('*').eq('type', 'classified').order('sort_order').then(({ data }) => {
      const allowedNames = classifiedSections.flatMap(section => section.categoryNames)
      const allowed = (data || []).filter(category => allowedNames.includes(category.name))
      setCategories(allowed)
      const requested = new URLSearchParams(window.location.search).get('category')
      const requestedCategory = allowed.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === requested)
      setCategoryId(requestedCategory?.id || allowed[0]?.id || '')
    })
  }, [])

  const selectedCategory = categories.find(c => c.id === categoryId)
  const section = classifiedSections.find(s => selectedCategory && s.categoryNames.includes(selectedCategory.name)) || classifiedSections[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!title.trim()) { setError('Post Name is required'); return }
    if (!categoryId) { setError('Please choose a category'); return }
    setSubmitting(true)
    setError('')

    try {
      const { data: listing, error: listingError } = await supabase.from('listings').insert({
        user_id: profile.id,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        price: section.showPrice ? (price.trim() || null) : null,
        location: location.trim() || null,
        contact_info: section.showContact ? (contactInfo.trim() || null) : null,
      }).select().single()
      if (listingError) throw listingError

      for (let i = 0; i < Math.min(images.length, 4); i++) {
        const file = images[i]
        const ext = file.name.split('.').pop()
        const path = `${profile.id}/${listing.id}/${i}.${ext}`
        const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path)
          await supabase.from('listing_images').insert({ listing_id: listing.id, image_url: urlData.publicUrl, sort_order: i })
        }
      }
      router.push(`/classifieds/${listing.id}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-sm text-[var(--text-secondary)]">HOME › Classifieds › {section.label}</div>
      <div className="text-center"><p className="text-sm text-[var(--text-secondary)]">KURIYA FRIENDS</p><h1 className="text-2xl font-bold mt-1">Create {section.label} Post</h1></div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">{error}</div>}
        <div><label className="block text-sm font-medium mb-1">Category *</label><select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="block text-sm font-medium mb-1">Post Name *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Post name" maxLength={200} /></div>
        <div><label className="block text-sm font-medium mb-1">{section.descriptionPrompt || 'Description'}</label><textarea value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} min-h-[150px]`} placeholder={section.descriptionPrompt || 'Add details...'} /></div>
        {section.showPrice && <div><label className="block text-sm font-medium mb-1">Price</label><input type="text" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} placeholder="Price" /></div>}
        <div><label className="block text-sm font-medium mb-1">Where?</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="Location" /></div>
        {section.showContact && <div><label className="block text-sm font-medium mb-1">Contact information</label><input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className={inputClass} placeholder="Email, phone, or other contact information" /></div>}
        {section.showPhotos && <div><label className="block text-sm font-medium mb-1">Photos (main photo + up to 3 additional)</label><input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files || []).slice(0, 4))} className="text-sm" />{images.length > 0 && <p className="text-xs text-[var(--text-secondary)] mt-1">{images.length} photo(s) selected</p>}</div>}
        <button type="submit" disabled={submitting} className="w-full py-3 btn-botanical disabled:opacity-50">{submitting ? 'Publishing...' : 'Publish Post'}</button>
      </form>
    </div>
  )
}
