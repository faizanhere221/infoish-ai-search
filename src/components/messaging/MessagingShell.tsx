'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Plus, MessageSquare, DollarSign, RefreshCw } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import type { ProfileDropdownProfile } from '@/components/ProfileDropdown'
import { ConversationList } from './ConversationList'
import { ChatThread } from './ChatThread'
import { MessageInput } from './MessageInput'
import { useConversationsList } from '@/hooks/useConversationsList'
import { useConversationThread } from '@/hooks/useConversationThread'
import { cn } from '@/lib/utils'
import type { Attachment } from '@/types/marketplace'

interface ConversationMeta {
  id: string
  creator_id: string
  brand_id: string
  deal_id: string | null
  creator?: { id: string; username: string; display_name: string; profile_photo_url: string | null }
  brand?: { id: string; company_name: string; logo_url: string | null; contact_name: string | null }
}

interface MessagingShellProps {
  conversationId?: string
}

export function MessagingShell({ conversationId }: MessagingShellProps) {
  const router = useRouter()
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileDropdownProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [conversation, setConversation] = useState<ConversationMeta | null>(null)
  const [conversationLoading, setConversationLoading] = useState(Boolean(conversationId))
  const [conversationError, setConversationError] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const authToken = localStorage.getItem('auth_token')

    if (!userStr || !authToken) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    setUserType(user.user_type)
    setUserId(user.id)
    setToken(authToken)
    if (profileStr) {setProfile(JSON.parse(profileStr))}
  }, [router])

  const {
    conversations,
    loading: listLoading,
    error: listError,
    unreadTotal,
    refresh: refreshList,
  } = useConversationsList(userType, profile?.id ?? null, token)

  const {
    messages,
    loading: messagesLoading,
    loadingOlder,
    hasOlder,
    error: messagesError,
    loadOlder,
    sendMessage,
    retryMessage,
    markAsRead,
    refresh: refreshMessages,
  } = useConversationThread(conversationId ?? null, token)

  const loadConversationMeta = useCallback(async () => {
    if (!conversationId || !token) {return}
    setConversationLoading(true)
    setConversationError(false)
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {throw new Error('Failed to load conversation')}
      const data = await res.json()
      setConversation(data.conversation)
    } catch {
      setConversationError(true)
    } finally {
      setConversationLoading(false)
    }
  }, [conversationId, token])

  useEffect(() => {
    if (conversationId) {loadConversationMeta()}
  }, [conversationId, loadConversationMeta])

  useEffect(() => {
    if (conversationId && token) {markAsRead()}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token])

  const handleSend = async (attachments: Attachment[]) => {
    const content = newMessage.trim()
    if (!content && attachments.length === 0) {return}
    setNewMessage('')
    setSending(true)
    await sendMessage(content, attachments)
    setSending(false)
  }

  const uploadAttachment = useCallback((file: File, onProgress: (pct: number) => void): Promise<Attachment> => {
    return new Promise((resolve, reject) => {
      if (!conversationId || !token) {
        reject(new Error('Not ready to upload'))
        return
      }
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/conversations/${conversationId}/attachments`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {onProgress(Math.round((e.loaded / e.total) * 100))}
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText).attachment)
          } catch {
            reject(new Error('Invalid upload response'))
          }
        } else {
          reject(new Error('Upload failed'))
        }
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      const formData = new FormData()
      formData.append('file', file)
      xhr.send(formData)
    })
  }, [conversationId, token])

  const getUnreadCount = (conv: { brand_unread: number; creator_unread: number }) =>
    userType === 'brand' ? conv.brand_unread : conv.creator_unread

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'unread' && getUnreadCount(conv) === 0) {return false}
    if (searchQuery) {
      const name = userType === 'brand' ? conv.creator?.display_name : conv.brand?.company_name
      return (name || '').toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const otherPartyName = userType === 'brand'
    ? conversation?.creator?.display_name
    : conversation?.brand?.company_name
  const otherPartyAvatar = userType === 'brand'
    ? conversation?.creator?.profile_photo_url
    : conversation?.brand?.logo_url

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <DashboardHeader userType={userType || 'brand'} profile={profile} />

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list pane — full width on mobile when no thread is
            open, a fixed-width sidebar on desktop always. */}
        <div
          className={cn(
            'w-full md:w-96 md:flex-shrink-0 md:border-r border-gray-200 bg-white flex-col',
            conversationId ? 'hidden md:flex' : 'flex'
          )}
        >
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">
                Messages
                {unreadTotal > 0 && (
                  <span className="ml-2 align-middle px-2 py-0.5 bg-brand-pink/10 text-brand-purple-dark text-sm font-medium rounded-full">
                    {unreadTotal}
                  </span>
                )}
              </h1>
              {userType === 'brand' && (
                <Link
                  href="/creators"
                  className="p-2 text-brand-purple-dark hover:bg-brand-pink/10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                  aria-label="Message a new creator"
                  title="Message a new creator"
                >
                  <Plus className="w-5 h-5" />
                </Link>
              )}
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <label htmlFor="conversation-search" className="sr-only">Search conversations by name</label>
              <input
                id="conversation-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={userType === 'brand' ? 'Search creators…' : 'Search brands…'}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
            </div>

            <div className="flex gap-2" role="tablist" aria-label="Filter conversations">
              <button
                role="tab"
                aria-selected={filter === 'all'}
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink',
                  filter === 'all'
                    ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                All
              </button>
              <button
                role="tab"
                aria-selected={filter === 'unread'}
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink',
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Unread{unreadTotal > 0 ? ` (${unreadTotal})` : ''}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listError ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-600 mb-2">Couldn&apos;t load your conversations.</p>
                <button
                  onClick={refreshList}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple-dark hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try again
                </button>
              </div>
            ) : (
              <ConversationList
                conversations={filteredConversations}
                currentConversationId={conversationId}
                userType={userType || 'brand'}
                isLoading={listLoading}
                emptyMessage={searchQuery ? 'No conversations match your search' : undefined}
              />
            )}
          </div>
        </div>

        {/* Thread pane — hidden on mobile until a conversation is open */}
        <div className={cn('flex-1 flex-col bg-gray-50', conversationId ? 'flex' : 'hidden md:flex')}>
          {!conversationId ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 bg-brand-pink/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-brand-purple-dark" aria-hidden="true" />
                </div>
                <p className="text-gray-500">Select a conversation to view messages</p>
              </div>
            </div>
          ) : conversationError ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <p className="text-gray-600 mb-3">This conversation couldn&apos;t be loaded.</p>
                <button
                  onClick={loadConversationMeta}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple-dark hover:underline"
                >
                  <RefreshCw className="w-4 h-4" /> Try again
                </button>
              </div>
            </div>
          ) : conversationLoading && !conversation ? (
            <div className="flex-1 flex items-center justify-center" aria-hidden="true">
              <div className="animate-pulse text-gray-400">Loading conversation…</div>
            </div>
          ) : conversation ? (
            <>
              <header className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => router.push('/messages')}
                      className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink flex-shrink-0"
                      aria-label="Back to all conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-pink to-brand-purple flex items-center justify-center text-white font-bold flex-shrink-0">
                      {otherPartyName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">{otherPartyName || 'Unknown'}</h2>
                      <p className="text-sm text-gray-500 truncate">
                        {userType === 'brand' ? `@${conversation.creator?.username}` : conversation.brand?.contact_name || 'Brand'}
                      </p>
                    </div>
                  </div>
                  {conversation.deal_id && (
                    <Link
                      href={`/dashboard/deals/${conversation.deal_id}`}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-purple-dark hover:bg-brand-pink/10 rounded-lg flex-shrink-0"
                    >
                      <DollarSign className="w-4 h-4" /> View deal
                    </Link>
                  )}
                </div>
              </header>

              {messagesError ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <p className="text-gray-600 mb-3">Couldn&apos;t load messages.</p>
                    <button
                      onClick={refreshMessages}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple-dark hover:underline"
                    >
                      <RefreshCw className="w-4 h-4" /> Try again
                    </button>
                  </div>
                </div>
              ) : (
                <ChatThread
                  messages={messages}
                  currentUserId={userId || ''}
                  conversationId={conversationId}
                  token={token}
                  otherPartyName={otherPartyName || 'Unknown'}
                  otherPartyAvatar={otherPartyAvatar}
                  isLoading={messagesLoading}
                  hasOlder={hasOlder}
                  loadingOlder={loadingOlder}
                  onLoadOlder={loadOlder}
                  onRetry={retryMessage}
                />
              )}

              {userType === 'brand' && !conversation.deal_id && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Ready to work together?</span>
                    <Link
                      href={`/dashboard/deals/new?creator_id=${conversation.creator_id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg font-medium hover:shadow-lg text-sm"
                    >
                      <DollarSign className="w-4 h-4" />
                      Create deal
                    </Link>
                  </div>
                </div>
              )}

              <MessageInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={handleSend}
                onUploadFile={uploadAttachment}
                sending={sending}
                placeholder={`Message ${otherPartyName || ''}…`}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MessagingShell
