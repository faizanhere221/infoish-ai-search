// ============================================================================
// INFOISHAI MARKETPLACE - TYPE DEFINITIONS
// ============================================================================
// These types match the Supabase database schema
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type UserType = 'creator' | 'brand' | 'admin'

export type DealStatus =
  | 'pending'
  | 'accepted'
  | 'paid'
  | 'in_progress'
  | 'delivered'
  | 'revision'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type PlatformType =
  | 'youtube'
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'tiktok'
  | 'newsletter'
  | 'podcast'
  | 'github'
  | 'blog'
  | 'other'

export type ContentType =
  | 'video_integration'
  | 'dedicated_video'
  | 'twitter_thread'
  | 'tweet'
  | 'linkedin_post'
  | 'newsletter_feature'
  | 'newsletter_dedicated'
  | 'podcast_mention'
  | 'podcast_episode'
  | 'blog_post'
  | 'github_readme'
  | 'instagram_post'
  | 'instagram_story'
  | 'tiktok_video'
  | 'other'

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface User {
  id: string
  email: string
  password_hash?: string
  user_type: UserType
  email_verified: boolean
  email_verified_at: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
  is_active: boolean
}

export interface Creator {
  id: string
  user_id: string
  username: string
  display_name: string
  bio: string | null
  profile_photo_url: string | null
  banner_image_url: string | null
  country: string | null
  city: string | null
  timezone: string | null
  niches: string[]
  languages: string[]
  years_of_experience: number | null
  verification_status: VerificationStatus
  verified_at: string | null
  total_followers: number
  avg_engagement_rate: number | null
  completed_deals: number
  avg_rating: number | null
  total_reviews: number
  is_available: boolean
  response_time: string | null
  min_budget: number | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface CreatorPlatform {
  id: string
  creator_id: string
  platform: PlatformType
  platform_username: string | null
  platform_url: string | null
  followers: number
  engagement_rate: number | null
  avg_views: number | null
  is_verified: boolean
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface CreatorService {
  id: string
  creator_id: string
  title: string
  description: string | null
  content_type: ContentType
  platform: PlatformType
  price: number
  currency: string
  delivery_days: number
  revisions_included: number
  includes: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatorPortfolio {
  id: string
  creator_id: string
  title: string
  description: string | null
  content_type: ContentType | null
  platform: PlatformType | null
  thumbnail_url: string | null
  content_url: string | null
  views: number | null
  likes: number | null
  comments: number | null
  display_order: number
  is_featured: boolean
  created_at: string
}

export interface Brand {
  id: string
  user_id: string
  company_name: string
  company_website: string | null
  logo_url: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  country: string | null
  contact_name: string | null
  contact_role: string | null
  verification_status: VerificationStatus
  verified_at: string | null
  total_deals: number
  total_spent: number
  avg_rating_given: number | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  creator_id: string
  brand_id: string
  service_id: string | null
  title: string
  description: string | null
  content_type: ContentType
  platform: PlatformType
  requirements: string | null
  deliverables: string[]
  amount: number
  platform_fee: number | null
  creator_payout: number | null
  currency: string
  deadline: string | null
  delivery_days: number | null
  revisions_allowed: number
  revisions_used: number
  status: DealStatus
  status_updated_at: string
  stripe_payment_intent_id: string | null
  paid_at: string | null
  released_at: string | null
  delivered_at: string | null
  delivery_url: string | null
  delivery_notes: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface DealMessage {
  id: string
  deal_id: string
  sender_id: string
  content: string
  attachments: Attachment[]
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface Conversation {
  id: string
  creator_id: string
  brand_id: string
  deal_id: string | null
  last_message_at: string | null
  last_message_preview: string | null
  creator_unread: number
  brand_unread: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments: Attachment[]
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface Review {
  id: string
  deal_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  title: string | null
  content: string | null
  communication_rating: number | null
  quality_rating: number | null
  timeliness_rating: number | null
  response: string | null
  response_at: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content: string | null
  related_type: string | null
  related_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface SavedCreator {
  id: string
  brand_id: string
  creator_id: string
  notes: string | null
  created_at: string
}

export interface Payment {
  id: string
  deal_id: string
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_transfer_id: string | null
  amount: number
  platform_fee: number | null
  creator_payout: number | null
  currency: string
  status: string
  paid_at: string | null
  released_at: string | null
  refunded_at: string | null
  created_at: string
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface Attachment {
  url: string
  filename: string
  type: string
  size: number
}

// ============================================================================
// JOINED/EXTENDED TYPES (for API responses)
// ============================================================================

export interface CreatorWithDetails extends Creator {
  platforms: CreatorPlatform[]
  services: CreatorService[]
  portfolio: CreatorPortfolio[]
  user?: Pick<User, 'email'>
}

export interface BrandWithDetails extends Brand {
  user?: Pick<User, 'email'>
}

export interface DealWithParties extends Deal {
  creator: Creator
  brand: Brand
  service?: CreatorService
  messages?: DealMessage[]
}

export interface ConversationWithParties extends Conversation {
  creator: Creator
  brand: Brand
  messages?: Message[]
}

export interface ReviewWithDetails extends Review {
  deal: Deal
  reviewer: User
  reviewee: User
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Auth
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  user_type: UserType
}

export interface AuthResponse {
  user: User
  token: string
  profile: Creator | Brand | null
}

// Creator
export interface CreateCreatorRequest {
  username: string
  display_name: string
  bio?: string
  country?: string
  city?: string
  niches: string[]
  languages: string[]
  platforms?: Omit<CreatorPlatform, 'id' | 'creator_id' | 'created_at' | 'updated_at'>[]
}

export interface UpdateCreatorRequest extends Partial<CreateCreatorRequest> {
  profile_photo_url?: string
  banner_image_url?: string
  is_available?: boolean
  response_time?: string
  min_budget?: number
}

// Brand
export interface CreateBrandRequest {
  company_name: string
  company_website?: string
  description?: string
  industry?: string
  company_size?: string
  country?: string
  contact_name?: string
  contact_role?: string
}

export interface UpdateBrandRequest extends Partial<CreateBrandRequest> {
  logo_url?: string
}

// Deal
export interface CreateDealRequest {
  creator_id: string
  service_id?: string
  title: string
  description?: string
  content_type: ContentType
  platform: PlatformType
  requirements?: string
  deliverables: string[]
  amount: number
  deadline?: string
  delivery_days?: number
  revisions_allowed?: number
}

export interface UpdateDealRequest {
  status?: DealStatus
  delivery_url?: string
  delivery_notes?: string
  cancellation_reason?: string
}

// Message
export interface SendMessageRequest {
  content: string
  attachments?: Attachment[]
}

// Review
export interface CreateReviewRequest {
  deal_id: string
  rating: number
  title?: string
  content?: string
  communication_rating?: number
  quality_rating?: number
  timeliness_rating?: number
}

// Search/Filter
export interface CreatorSearchParams {
  query?: string
  niches?: string[]
  platforms?: PlatformType[]
  min_followers?: number
  max_followers?: number
  min_rating?: number
  min_budget?: number
  max_budget?: number
  country?: string
  is_available?: boolean
  is_verified?: boolean
  sort_by?: 'followers' | 'rating' | 'deals' | 'created_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type ApiError = {
  error: string
  message: string
  status: number
}