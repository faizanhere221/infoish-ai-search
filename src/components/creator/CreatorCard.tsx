'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  CheckCircle, 
  Star, 
  Heart,
  MapPin,
  Users,
  Sparkles,
  Crown
} from 'lucide-react'
import type { CreatorProfile } from '@/types/marketplace'

// Platform icons mapping
const PLATFORM_ICONS: Record<string, string> = {
  youtube: '📺',
  twitter: '𝕏',
  instagram: '📸',
  tiktok: '🎵',
  linkedin: '💼',
  twitch: '🎮',
  newsletter: '📧',
  podcast: '🎙️',
}

interface CreatorCardProps {
  creator: CreatorProfile
  onSave?: (creatorId: string) => void
  onUnsave?: (creatorId: string) => void
  isSaved?: boolean
  showSaveButton?: boolean
  variant?: 'grid' | 'list'
}

export function CreatorCard({
  creator,
  onSave,
  onUnsave,
  isSaved = false,
  showSaveButton = true,
  variant = 'grid',
}: CreatorCardProps) {
  const [saved, setSaved] = useState(isSaved)
  const [isHovered, setIsHovered] = useState(false)

  // Get platforms from social accounts
  const platforms = Object.keys(creator.social_accounts || {})
  
  // Get total followers
  const totalFollowers = Object.values(creator.social_accounts || {}).reduce((sum, account) => {
    const acc = account as { followers?: number; subscribers?: number }
    return sum + (acc.followers || acc.subscribers || 0)
  }, 0)

  // Format follower count
  const formatFollowers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Get minimum service price
  const services = (creator.services || []) as Array<{ rate: number; isActive: boolean }>
  const activeServices = services.filter(s => s.isActive)
  const minPrice = activeServices.length > 0 
    ? Math.min(...activeServices.map(s => s.rate))
    : null

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (saved) {
      onUnsave?.(creator.id)
    } else {
      onSave?.(creator.id)
    }
    setSaved(!saved)
  }

  if (variant === 'list') {
    return (
      <Link
        href={`/creators/${creator.username}`}
        className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {creator.profile_photo_url ? (
              <Image
                src={creator.profile_photo_url}
                alt={creator.display_name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {creator.display_name[0]}
                </span>
              </div>
            )}
            {creator.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{creator.display_name}</h3>
              {creator.is_founding_creator && (
                <Crown className="w-4 h-4 text-amber-500" />
              )}
              {creator.is_featured && (
                <Sparkles className="w-4 h-4 text-purple-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 mb-2">@{creator.username}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {creator.avg_rating.toFixed(1)}
              </span>
              <span className="text-gray-500">{creator.total_deals_completed} deals</span>
              {totalFollowers > 0 && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Users className="w-4 h-4" />
                  {formatFollowers(totalFollowers)}
                </span>
              )}
            </div>
          </div>

          {/* Platforms & Price */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              {platforms.slice(0, 4).map(platform => (
                <span key={platform} className="text-lg" title={platform}>
                  {PLATFORM_ICONS[platform] || '🌐'}
                </span>
              ))}
            </div>
            {minPrice && (
              <span className="text-sm font-semibold text-gray-900">
                From ${minPrice}
              </span>
            )}
          </div>

          {/* Save Button */}
          {showSaveButton && (
            <button
              onClick={handleSaveClick}
              className={`p-2 rounded-full transition-colors ${
                saved 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </Link>
    )
  }

  // Grid variant (default)
  return (
    <Link
      href={`/creators/${creator.username}`}
      className="block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover/Header */}
      <div className="relative h-24 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500">
        {creator.cover_photo_url && (
          <Image
            src={creator.cover_photo_url}
            alt=""
            fill
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {creator.is_founding_creator && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Founding
            </span>
          )}
          {creator.is_featured && (
            <span className="px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        {/* Save Button */}
        {showSaveButton && (
          <button
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
              saved 
                ? 'bg-white text-red-500' 
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
            } ${isHovered || saved ? 'opacity-100' : 'opacity-0'}`}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-4 -mt-10">
        <div className="relative inline-block">
          {creator.profile_photo_url ? (
            <Image
              src={creator.profile_photo_url}
              alt={creator.display_name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 border-4 border-white shadow-sm flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {creator.display_name[0]}
              </span>
            </div>
          )}
          {creator.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        {/* Name & Username */}
        <h3 className="font-semibold text-gray-900 truncate">{creator.display_name}</h3>
        <p className="text-sm text-gray-500 mb-2">@{creator.username}</p>

        {/* Location */}
        {(creator.city || creator.country) && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5" />
            {[creator.city, creator.country].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Niches */}
        {creator.niches && creator.niches.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {creator.niches.slice(0, 2).map(niche => (
              <span 
                key={niche}
                className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full"
              >
                {niche}
              </span>
            ))}
            {creator.niches.length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{creator.niches.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Platforms */}
        <div className="flex items-center gap-1 mb-3">
          {platforms.slice(0, 5).map(platform => (
            <span 
              key={platform} 
              className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-sm"
              title={platform}
            >
              {PLATFORM_ICONS[platform] || '🌐'}
            </span>
          ))}
          {platforms.length > 5 && (
            <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
              +{platforms.length - 5}
            </span>
          )}
        </div>

        {/* Stats & Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-900">{creator.avg_rating.toFixed(1)}</span>
              <span className="text-gray-400">({creator.total_reviews})</span>
            </span>
          </div>
          {minPrice && (
            <span className="text-sm">
              <span className="text-gray-500">From </span>
              <span className="font-semibold text-gray-900">${minPrice}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default CreatorCard