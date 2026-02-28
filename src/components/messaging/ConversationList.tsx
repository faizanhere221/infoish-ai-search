'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, CheckCheck, Clock } from 'lucide-react'
import type { Conversation } from '@/types/marketplace'

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId?: string
  userType: 'creator' | 'brand'
  isLoading?: boolean
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ConversationList({
  conversations,
  currentConversationId,
  userType,
  isLoading = false,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <MessageSquare className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-1">No conversations yet</p>
        <p className="text-sm text-gray-400">
          {userType === 'brand' 
            ? 'Start a conversation by messaging a creator'
            : 'Conversations with brands will appear here'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map(conversation => {
        const unreadCount = userType === 'creator' 
          ? conversation.creator_unread_count 
          : conversation.brand_unread_count
        const isActive = conversation.id === currentConversationId
        
        // Get display info based on user type
        let name: string | undefined
        let avatar: string | undefined
        
        if (userType === 'creator' && conversation.brand) {
          name = conversation.brand.company_name
          avatar = conversation.brand.logo_url
        } else if (userType === 'brand' && conversation.creator) {
          name = conversation.creator.display_name
          avatar = conversation.creator.profile_photo_url
        }
        
        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
              isActive ? 'bg-blue-50 hover:bg-blue-50' : ''
            }`}
          >
            {/* Avatar */}
            {avatar ? (
              <Image
                src={avatar}
                alt={name || 'User'}
                width={48}
                height={48}
                className={`w-12 h-12 object-cover shrink-0 ${
                  userType === 'creator' ? 'rounded-lg' : 'rounded-full'
                }`}
              />
            ) : (
              <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
                userType === 'creator' 
                  ? 'rounded-lg bg-blue-100' 
                  : 'rounded-full bg-violet-100'
              }`}>
                <span className={`font-semibold ${
                  userType === 'creator' ? 'text-blue-600' : 'text-violet-600'
                }`}>
                  {name?.[0] || '?'}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-medium truncate ${
                  unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {name || 'Unknown'}
                </h3>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {conversation.last_message_at 
                    ? formatTime(conversation.last_message_at)
                    : ''
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${
                  unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {conversation.last_message_preview || 'No messages yet'}
                </p>
                
                {unreadCount > 0 && (
                  <span className="ml-2 min-w-[20px] h-5 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center px-1.5 shrink-0">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default ConversationList