'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare } from 'lucide-react'
import type { ConversationSummary } from '@/hooks/useConversationsList'
import { platformEmoji as emojiFor } from '@/utils/constants'

interface ConversationListProps {
  conversations: ConversationSummary[]
  currentConversationId?: string
  userType: 'creator' | 'brand'
  isLoading?: boolean
  emptyMessage?: string
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {return 'Just now'}
  if (diffMins < 60) {return `${diffMins}m`}
  if (diffHours < 24) {return `${diffHours}h`}
  if (diffDays < 7) {return `${diffDays}d`}

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ConversationList({
  conversations,
  currentConversationId,
  userType,
  isLoading = false,
  emptyMessage,
}: ConversationListProps) {
  if (isLoading && conversations.length === 0) {
    return (
      <div className="space-y-2 p-4" aria-hidden="true">
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
          <MessageSquare className="w-7 h-7 text-gray-400" aria-hidden="true" />
        </div>
        <p className="text-gray-500 mb-1">{emptyMessage ?? 'No conversations yet'}</p>
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
    <ul className="divide-y divide-gray-100">
      {conversations.map(conversation => {
        const unreadCount = userType === 'creator' ? conversation.creator_unread : conversation.brand_unread
        const isActive = conversation.id === currentConversationId
        const isUnread = unreadCount > 0

        let name: string | undefined
        let avatar: string | null | undefined
        let platformEmoji: string | null = null

        if (userType === 'creator' && conversation.brand) {
          name = conversation.brand.company_name
          avatar = conversation.brand.logo_url
        } else if (userType === 'brand' && conversation.creator) {
          name = conversation.creator.display_name
          avatar = conversation.creator.profile_photo_url
          const primaryPlatform = (conversation.creator as { primary_platform?: string | null }).primary_platform
          platformEmoji = primaryPlatform ? emojiFor(primaryPlatform) : null
        }

        return (
          <li key={conversation.id}>
            <Link
              href={`/messages/${conversation.id}`}
              className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-pink ${
                isActive ? 'bg-brand-pink/5' : ''
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt=""
                    width={48}
                    height={48}
                    className={`w-12 h-12 object-cover ${userType === 'creator' ? 'rounded-lg' : 'rounded-full'}`}
                  />
                ) : (
                  <div className={`w-12 h-12 flex items-center justify-center ${
                    userType === 'creator' ? 'rounded-lg bg-brand-purple/10' : 'rounded-full bg-brand-pink/10'
                  }`}>
                    <span className="font-semibold text-brand-purple-dark">{name?.[0] || '?'}</span>
                  </div>
                )}
                {platformEmoji && (
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center bg-white rounded-full text-xs border border-gray-200"
                    title={(conversation.creator as { primary_platform?: string } | null)?.primary_platform}
                    aria-hidden="true"
                  >
                    {platformEmoji}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {name || 'Unknown'}
                  </h3>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {conversation.last_message_at ? formatTime(conversation.last_message_at) : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                    {conversation.last_message_preview || 'No messages yet'}
                  </p>

                  {isUnread && (
                    <span
                      className="min-w-[20px] h-5 bg-gradient-to-r from-brand-pink to-brand-purple text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shrink-0"
                      aria-label={`${unreadCount} unread messages`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default ConversationList
