'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  Sparkles,
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Loader2,
  CheckCircle,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments: any[]
  is_read: boolean
  created_at: string
}

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
  messages: Message[]
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadData()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    try {
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')

      if (!userStr) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userStr)
      setUserType(user.user_type)
      setUserId(user.id)

      if (profileStr) {
        setProfile(JSON.parse(profileStr))
      }

      // Fetch conversation with messages
      const res = await fetch(`/api/conversations/${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setConversation(data.conversation)
        setMessages(data.conversation.messages || [])
        
        // Mark messages as read
        await fetch(`/api/conversations/${conversationId}/messages?mark_as_read=true&user_id=${user.id}`)
      } else {
        console.error('Failed to fetch conversation')
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading conversation:', err)
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !userId) return

    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          content: newMessage.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.data])
        setNewMessage('')
        inputRef.current?.focus()
      } else {
        console.error('Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
    }
    setSending(false)
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
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  // Check if we need a date separator
  const needsDateSeparator = (message: Message, index: number) => {
    if (index === 0) return true
    const prevDate = new Date(messages[index - 1].created_at).toDateString()
    const currDate = new Date(message.created_at).toDateString()
    return prevDate !== currDate
  }

  // Get other party info
  const otherParty = userType === 'brand' ? conversation?.creator : conversation?.brand
  const otherPartyName = userType === 'brand' 
    ? conversation?.creator?.display_name 
    : conversation?.brand?.company_name

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
                const isOwnMessage = message.sender_id === userId
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
                            isOwnMessage
                              ? 'bg-violet-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-right' : 'text-left'} text-gray-500`}>
                          {formatMessageTime(message.created_at)}
                        </p>
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
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
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