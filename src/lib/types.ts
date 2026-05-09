export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  is_admin: boolean
  is_banned: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  type: 'classified' | 'discussion'
  sort_order: number
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  category_id: string
  title: string
  description: string
  price: string | null
  location: string | null
  contact_info: string | null
  status: 'active' | 'sold' | 'closed'
  created_at: string
  updated_at: string
  profiles?: Profile
  categories?: Category
  listing_images?: ListingImage[]
}

export interface ListingImage {
  id: string
  listing_id: string
  image_url: string
  sort_order: number
}

export interface ListingComment {
  id: string
  listing_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Discussion {
  id: string
  user_id: string
  category_id: string
  title: string
  body: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  profiles?: Profile
  categories?: Category
  _comment_count?: number
}

export interface DiscussionComment {
  id: string
  discussion_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}
