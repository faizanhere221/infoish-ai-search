'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { CheckCheck, Clock, AlertCircle } from 'lucide-react'
import type { Message } from '@/types/marketplace'

interface ChatThreadProps {
  messages: Message[]
  currentUserId: string
  currentUserType: 'creator' | 'brand'
  otherPartyName: string
  otherPartyAvatar?: string
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

function shouldShowDateDivider(current: Message, previous?: Message): boolean {
  if (!previous) return true
  
  const currentDate = new Date(current.created_at).toDateString()
  const previousDate = new Date(previous.created_at).toDateString()
  
  return currentDate !== previousDate
}

function formatDateDivider(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric' 
  })
}

export function ChatThread({
  messages,
  currentUserId,
  currentUserType,
  otherPartyName,
  otherPartyAvatar,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}: ChatThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle scroll for loading more
  const handleScroll = () => {
    if (!containerRef.current || !hasMore || isLoading) return
    
    const { scrollTop } = containerRef.current
    if (scrollTop === 0) {
      onLoadMore?.()
    }
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {/* Load More Button */}
      {hasMore && (
        <div className="text-center py-2">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load earlier messages'}
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const isOwn = message.sender_type === currentUserType
        const showDateDivider = shouldShowDateDivider(message, messages[index - 1])
        const isSystem = message.is_system_message
        
        return (
          <div key={message.id}>
            {/* Date Divider */}
            {showDateDivider && (
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500 font-medium">
                  {formatDateDivider(message.created_at)}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* System Message */}
            {isSystem ? (
              <div className="flex justify-center my-2">
                <div className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 max-w-md text-center">
                  {message.content}
                </div>
              </div>
            ) : (
              /* Regular Message */
              <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {!isOwn && (
                  <div className="flex-shrink-0">
                    {otherPartyAvatar ? (
                      <Image 
                        src={otherPartyAvatar} 
                        alt={otherPartyName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                        <span className="text-violet-600 text-sm font-medium">
                          {otherPartyName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    isOwn 
                      ? 'bg-blue-600 text-white rounded-br-md' 
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, i) => (
                          <div 
                            key={i}
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              isOwn ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                          >
                            <span className="text-sm truncate">
                              {attachment.name || 'Attachment'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Meta */}
                  <div className={`flex items-center gap-1.5 mt-1 text-xs text-gray-400 ${
                    isOwn ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      message.is_read ? (
                        <CheckCheck className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Empty State */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No messages yet</p>
          <p className="text-sm text-gray-400">
            Start the conversation by sending a message
          </p>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatThread