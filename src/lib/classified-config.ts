export type ClassifiedSection = {
  slug: string
  label: string
  breadcrumb: string
  categoryNames: string[]
  emoji: string
  descriptionPrompt: string
  showPrice: boolean
  showContact: boolean
  showDate: boolean
  showPhotos: boolean
}

export const classifiedSections: ClassifiedSection[] = [
  { slug: 'sell', label: 'SELL', breadcrumb: 'SELL', categoryNames: ['For Sale'], emoji: '🏷️', descriptionPrompt: 'Description (size, colour, delivery information, etc.)', showPrice: true, showContact: true, showDate: true, showPhotos: true },
  { slug: 'buy', label: 'BUY', breadcrumb: 'BUY', categoryNames: ['Wanted'], emoji: '🛍️', descriptionPrompt: 'Description (price, size, colour, delivery information, etc.)', showPrice: true, showContact: true, showDate: true, showPhotos: false },
  { slug: 'free-offer', label: 'Free Offer', breadcrumb: 'Free Offer', categoryNames: ['Free Stuff to Give'], emoji: '🎁', descriptionPrompt: 'Description (size, colour, delivery information, etc.)', showPrice: false, showContact: true, showDate: true, showPhotos: true },
  { slug: 'housing', label: 'Housing', breadcrumb: 'Housing', categoryNames: [], emoji: '🏠', descriptionPrompt: '', showPrice: false, showContact: false, showDate: false, showPhotos: false },
  { slug: 'housing-offer', label: 'Housing Offer', breadcrumb: 'Housing Offer', categoryNames: ['Housing Offer'], emoji: '🏡', descriptionPrompt: 'Description: number of bedrooms, price, where, available from when, conditions, guarantee needed, deposit needed.', showPrice: true, showContact: true, showDate: true, showPhotos: true },
  { slug: 'housing-wanted', label: 'Housing Wanted', breadcrumb: 'Housing Wanted', categoryNames: ['Housing Wanted'], emoji: '🔎', descriptionPrompt: 'Description: number of bedrooms needed, price, where, needed from when, conditions.', showPrice: true, showContact: true, showDate: true, showPhotos: false },
  { slug: 'pet', label: 'PET', breadcrumb: 'PET', categoryNames: ['Pet'], emoji: '🐾', descriptionPrompt: 'Description: offer or wanted? Dog, cat, what service? Include any useful details.', showPrice: false, showContact: true, showDate: true, showPhotos: true },
  { slug: 'children', label: 'Children', breadcrumb: 'Children', categoryNames: ['Children'], emoji: '🧸', descriptionPrompt: 'Description: offer or wanted? What service? How many children? How old are they?', showPrice: false, showContact: true, showDate: true, showPhotos: true },
  { slug: 'other-services', label: 'Other Services', breadcrumb: 'Other Services', categoryNames: ['Services Available'], emoji: '🛠️', descriptionPrompt: 'Description: offer or wanted? What service? Price and useful details.', showPrice: false, showContact: true, showDate: true, showPhotos: true },
  { slug: 'events', label: 'Events', breadcrumb: 'Events', categoryNames: ['Events'], emoji: '📅', descriptionPrompt: 'Description: when, where, what, and for whom?', showPrice: false, showContact: false, showDate: true, showPhotos: true },
]

export function getClassifiedSection(slug: string) {
  return classifiedSections.find(section => section.slug === slug)
}

export function avatarInitials(name?: string | null) {
  const value = (name || '?').trim()
  return value.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}
