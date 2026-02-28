// User Types
export type UserType = 'creator' | 'brand' | 'admin'
export type CreatorStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type DealStatus = 
  | 'pending' | 'accepted' | 'declined' | 'in_progress' 
  | 'delivered' | 'revision' | 'approved' | 'completed' 
  | 'cancelled' | 'disputed' | 'refunded'

// Service Type
export interface Service {
  id: string
  platform: string
  type: string
  name: string
  description?: string
  rate: number
  currency: string
  turnaroundDays: number
  isActive: boolean
}

// Social Accounts
export interface SocialAccount {
  handle: string
  url: string
  followers: number
  verified: boolean
}

export interface SocialAccounts {
  twitter?: SocialAccount
  youtube?: SocialAccount & { subscribers: number }
  linkedin?: SocialAccount
  tiktok?: SocialAccount
  github?: SocialAccount
  newsletter?: SocialAccount & { subscribers: number }
  podcast?: SocialAccount & { listeners: number }
}

// Portfolio Item
export interface PortfolioItem {
  id: string
  type: 'link' | 'image' | 'video'
  url: string
  title?: string
  thumbnail?: string
  description?: string
  platform?: string
  metrics?: Record<string, number | string>
}

// Creator Profile
export interface CreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  email: string
  bio?: string
  profile_photo_url?: string
  cover_photo_url?: string
  country: string
  city?: string
  timezone?: string
  languages: string[]
  niches: string[]
  social_accounts: SocialAccounts
  services: Service[]
  portfolio_items: PortfolioItem[]
  stripe_account_id?: string
  stripe_onboarded: boolean
  status: CreatorStatus
  is_verified: boolean
  is_featured: boolean
  is_founding_creator: boolean
  avg_rating: number
  total_reviews: number
  total_deals_completed: number
  total_earnings: number
  response_rate: number
  avg_response_time_hours: number
  profile_views: number
  created_at: string
  updated_at: string
}

// Brand Profile
export interface BrandProfile {
  id: string
  user_id: string
  company_name: string
  email: string
  website?: string
  logo_url?: string
  description?: string
  industry?: string
  company_size?: string
  country: string
  contact_name?: string
  contact_role?: string
  stripe_customer_id?: string
  total_spent: number
  total_deals: number
  created_at: string
  updated_at: string
}

// Marketplace User
export interface MarketplaceUser {
  id: string
  email: string
  user_type: UserType
  google_id?: string
  avatar_url?: string
  email_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
}

// Conversation
export interface Conversation {
  id: string
  creator_id: string
  brand_id: string
  last_message_at?: string
  last_message_preview?: string
  creator_unread_count: number
  brand_unread_count: number
  status: string
  created_at: string
  // Joined data
  creator?: CreatorProfile
  brand?: BrandProfile
}

export interface Attachment {
  id: string
  type: 'image' | 'file' | 'video'
  url: string
  name: string
  size?: number
  mimeType?: string
}

// Message
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'creator' | 'brand'
  content: string
  attachments: Attachment[]
  is_read: boolean
  read_at?: string
  is_system_message: boolean
  created_at: string
}

export interface Deliverable {
  id: string
  description: string
  is_completed: boolean
  completed_at?: string
}

// Deal
export interface Deal {
  id: string
  deal_number: number
  conversation_id?: string
  creator_id: string
  brand_id: string
  title: string
  description?: string
  deliverables: Deliverable[]
  services: Service[]
  amount_cents: number
  platform_fee_cents: number
  creator_payout_cents: number
  currency: string
  stripe_payment_intent_id?: string
  stripe_transfer_id?: string
  status: DealStatus
  deadline?: string
  accepted_at?: string
  delivered_at?: string
  approved_at?: string
  completed_at?: string
  cancelled_at?: string
  revision_count: number
  max_revisions: number
  created_at: string
  updated_at: string
  // Joined data
  creator?: CreatorProfile
  brand?: BrandProfile
  review?: Review
}

// Review
export interface Review {
  id: string
  deal_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string
  communication_rating?: number
  quality_rating?: number
  was_on_time?: boolean
  would_work_again?: boolean
  response?: string
  response_at?: string
  is_public: boolean
  created_at: string
}