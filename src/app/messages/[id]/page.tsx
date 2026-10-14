'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  Loader2,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import { useConversationThread, type ThreadMessage } from '@/hooks/useConversationThread'

interface Conversation {
  id: string
  creator_id: string
  brand_id: string
  deal_id: string | null
  creator?: {
    id: string
    username: string
    display_name: string
    profile_photo_url: string | null
  }
  brand?: {
    id: string
    company_name: string
    logo_url: string | null
    contact_name: string | null
  }
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [conversationLoading, setConversationLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    retryMessage,
    markAsRead,
  } = useConversationThread(conversationId, token)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const authToken = localStorage.getItem('auth_token')

    if (!userStr || !authToken) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    setUserType(user.user_type)
    setUserId(user.id)
    setToken(authToken)
  }, [router])

  const loadConversation = useCallback(async () => {
    if (!token) {return}
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setConversation(data.conversation)
      } else {
        console.error('Failed to fetch conversation')
      }
    } catch (err) {
      console.error('Error loading conversation:', err)
    } finally {
      setConversationLoading(false)
    }
  }, [conversationId, token])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  // Mark the thread read once we know who's viewing it
  useEffect(() => {
    if (token) {markAsRead()}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    const content = newMessage.trim()
    if (!content) {return}
    setNewMessage('')
    await sendMessage(content)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Format time
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {return 'Today'}
    if (diffDays === 1) {return 'Yesterday'}
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  // Check if we need a date separator
  const needsDateSeparator = (message: ThreadMessage, index: number) => {
    if (index === 0) {return true}
    const prevDate = new Date(messages[index - 1].created_at).toDateString()
    const currDate = new Date(message.created_at).toDateString()
    return prevDate !== currDate
  }

  // Get other party info
  const otherPartyName = userType === 'brand'
    ? conversation?.creator?.display_name
    : conversation?.brand?.company_name

  const loading = conversationLoading || (messagesLoading && messages.length === 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Conversation not found</p>
          <Link href="/messages" className="mt-4 text-violet-600 hover:underline">
            Back to Messages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/messages')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar and Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {otherPartyName?.charAt(0) || '?'}
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{otherPartyName}</h1>
                  <p className="text-sm text-gray-500">
                    {userType === 'brand'
                      ? `@${conversation.creator?.username}`
                      : conversation.brand?.contact_name || 'Brand'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {userType === 'brand' && (
                <Link
                  href={`/creators/${conversation.creator?.username}`}
                  className="px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg font-medium"
                >
                  View Profile
                </Link>
              )}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === userId || message.pendingStatus !== undefined
                const showDateSeparator = needsDateSeparator(message, index)

                return (
                  <div key={message.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-6">
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
                          {formatDateSeparator(message.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Message */}
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.is_system
                              ? 'bg-gray-100 text-gray-600 italic border border-gray-200'
                              : isOwnMessage
                              ? 'bg-violet-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                          } ${message.pendingStatus === 'failed' ? 'opacity-60' : ''}`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          {message.pendingStatus === 'sending' && (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Sending…
                            </span>
                          )}
                          {message.pendingStatus === 'failed' && (
                            <>
                              <span className="text-red-500">Failed to send</span>
                              <button
                                onClick={() => retryMessage(message.id)}
                                className="flex items-center gap-1 text-violet-600 hover:underline"
                              >
                                <RefreshCw className="w-3 h-3" /> Retry
                              </button>
                            </>
                          )}
                          {!message.pendingStatus && <span>{formatMessageTime(message.created_at)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Start the conversation</h3>
              <p className="text-gray-500 mt-1">
                Send a message to {otherPartyName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {userType === 'brand' && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <span className="text-sm text-gray-500">Ready to work together?</span>
            <Link
              href={`/dashboard/deals/new?creator_id=${conversation.creator_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-sm"
            >
              <DollarSign className="w-4 h-4" />
              Create Deal
            </Link>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-end gap-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
