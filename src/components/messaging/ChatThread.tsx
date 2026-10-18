'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Clock, RefreshCw, MessageSquare, FileText, Download, ImageOff, ArrowRight, Flag } from 'lucide-react'
import type { ThreadMessage } from '@/hooks/useConversationThread'
import type { Attachment } from '@/types/marketplace'
import { useSignedAttachmentUrl } from '@/hooks/useSignedAttachmentUrl'
import { getEventCta, campaignCreatorGoUrl } from '@/lib/campaign-creator-cta'
import { ReportDialog } from '@/components/ReportDialog'

interface ChatThreadProps {
  messages: ThreadMessage[]
  currentUserId: string
  conversationId: string
  token: string | null
  otherPartyName: string
  otherPartyAvatar?: string | null
  viewerType: 'brand' | 'creator'
  isLoading?: boolean
  hasOlder?: boolean
  loadingOlder?: boolean
  onLoadOlder?: () => void
  onRetry?: (tempId: string) => void
}

function AttachmentPreview({
  attachment,
  conversationId,
  token,
  own,
}: {
  attachment: Attachment
  conversationId: string
  token: string | null
  own: boolean
}) {
  const { url, loading, error } = useSignedAttachmentUrl(conversationId, attachment.path, token)

  if (loading) {
    return <div className="w-32 h-20 rounded-lg bg-black/10 animate-pulse" aria-label="Loading attachment" />
  }

  if (error || !url) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${own ? 'bg-white/20' : 'bg-gray-200'}`}>
        <ImageOff className="w-4 h-4" aria-hidden="true" /> Couldn&apos;t load {attachment.name}
      </div>
    )
  }

  if (attachment.type === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed URL with a rotating token/expiry, not a static asset next/image can cache */}
        <img src={url} alt={attachment.name} className="max-w-[220px] max-h-[220px] rounded-lg object-cover" />
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      className={`flex items-center gap-2 p-2 rounded-lg hover:opacity-90 ${own ? 'bg-white/20' : 'bg-gray-200'}`}
    >
      <FileText className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm truncate max-w-[160px]">{attachment.name}</span>
      <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-70" aria-hidden="true" />
    </a>
  )
}

const GROUP_WINDOW_MS = 5 * 60 * 1000

function isOwnMessage(message: ThreadMessage, currentUserId: string): boolean {
  return message.sender_id === currentUserId || message.pendingStatus !== undefined
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function shouldShowDateDivider(current: ThreadMessage, previous?: ThreadMessage): boolean {
  if (!previous) {return true}
  return new Date(current.created_at).toDateString() !== new Date(previous.created_at).toDateString()
}

function formatDateDivider(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) {return 'Today'}
  if (diffDays === 1) {return 'Yesterday'}
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// A message is grouped with the one before it (no repeated avatar/timestamp)
// when it's the same sender, not a system message, and close in time.
function isGroupedWithPrevious(current: ThreadMessage, previous?: ThreadMessage): boolean {
  if (!previous) {return false}
  if (current.is_system || previous.is_system) {return false}
  if (current.sender_id !== previous.sender_id) {return false}
  if (new Date(current.created_at).toDateString() !== new Date(previous.created_at).toDateString()) {return false}
  return new Date(current.created_at).getTime() - new Date(previous.created_at).getTime() < GROUP_WINDOW_MS
}

export function ChatThread({
  messages,
  currentUserId,
  conversationId,
  token,
  otherPartyName,
  otherPartyAvatar,
  viewerType,
  isLoading = false,
  hasOlder = false,
  loadingOlder = false,
  onLoadOlder,
  onRetry,
}: ChatThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [wasAtBottom, setWasAtBottom] = useState(true)
  const [reportingMessage, setReportingMessage] = useState<ThreadMessage | null>(null)

  // Only auto-scroll to the newest message if the viewer was already at (or
  // near) the bottom — otherwise a poll landing new messages would yank
  // someone reading older history back down.
  useEffect(() => {
    if (wasAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) {return}

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setWasAtBottom(distanceFromBottom < 80)

    if (el.scrollTop < 40 && hasOlder && !loadingOlder) {
      onLoadOlder?.()
    }
  }

  // Index of the last message sent by the current user, to show a "Seen"
  // receipt under it once the other party has read it.
  let lastOwnIndex = -1
  messages.forEach((m, i) => {
    if (isOwnMessage(m, currentUserId) && !m.is_system) {lastOwnIndex = i}
  })

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1"
      role="log"
      aria-label={`Conversation with ${otherPartyName}`}
      aria-live="polite"
    >
      {hasOlder && (
        <div className="text-center py-2">
          <button
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="text-sm font-medium text-brand-purple-dark hover:underline disabled:opacity-50 rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
          >
            {loadingOlder ? 'Loading…' : 'Load older messages'}
          </button>
        </div>
      )}

      {messages.map((message, index) => {
        const own = isOwnMessage(message, currentUserId)
        const previous = messages[index - 1]
        const showDateDivider = shouldShowDateDivider(message, previous)
        const grouped = !showDateDivider && isGroupedWithPrevious(message, previous)
        const showSeen = index === lastOwnIndex && message.is_read

        return (
          <div key={message.id}>
            {showDateDivider && (
              <div className="flex items-center gap-4 my-4" role="separator">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500 font-medium">{formatDateDivider(message.created_at)}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {message.is_system ? (
              <div className="flex justify-center my-2">
                {(() => {
                  const cta = getEventCta(message.related_type, viewerType)
                  if (!cta || !message.related_id) {
                    return (
                      <div className="px-4 py-2 bg-brand-purple/10 rounded-full text-sm text-brand-purple-dark max-w-md text-center">
                        {message.content}
                      </div>
                    )
                  }
                  return (
                    <div className="max-w-md w-full bg-white border border-brand-pink/20 rounded-xl shadow-sm overflow-hidden">
                      <p className="px-4 py-2.5 text-sm text-gray-700 text-center">{message.content}</p>
                      <Link
                        href={campaignCreatorGoUrl(message.related_id, cta.tab)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white text-sm font-medium hover:shadow-md"
                      >
                        {cta.label} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className={`flex gap-3 ${own ? 'flex-row-reverse' : ''} ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                <div className="flex-shrink-0 w-8">
                  {!own && !grouped && (
                    otherPartyAvatar ? (
                      <Image
                        src={otherPartyAvatar}
                        alt={otherPartyName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center" aria-hidden="true">
                        <span className="text-brand-purple-dark text-sm font-medium">{otherPartyName[0]}</span>
                      </div>
                    )
                  )}
                </div>

                <div className={`max-w-[70%] flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl ${
                      own
                        ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    } ${message.pendingStatus === 'failed' ? 'opacity-60' : ''}`}
                  >
                    {message.content && (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}

                    {message.attachments && message.attachments.length > 0 && (
                      <div className={`space-y-2 ${message.content ? 'mt-2' : ''}`}>
                        {message.attachments.map((attachment) => (
                          <AttachmentPreview
                            key={attachment.id}
                            attachment={attachment}
                            conversationId={conversationId}
                            token={token}
                            own={own}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`flex items-center gap-1.5 mt-1 text-xs text-gray-400 ${own ? 'justify-end' : 'justify-start'}`}>
                    {message.pendingStatus === 'sending' && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" /> Sending…
                      </span>
                    )}
                    {message.pendingStatus === 'failed' && (
                      <>
                        <span className="text-red-500">Not sent</span>
                        <button
                          onClick={() => onRetry?.(message.id)}
                          className="flex items-center gap-1 text-brand-purple-dark hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                          aria-label="Retry sending this message"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      </>
                    )}
                    {!message.pendingStatus && <span>{formatMessageTime(message.created_at)}</span>}
                    {!own && (
                      <button
                        onClick={() => setReportingMessage(message)}
                        className="text-gray-300 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
                        aria-label="Report this message"
                        title="Report"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {showSeen && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Check className="w-3 h-3" /> Seen
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-gray-500 mb-1">No messages yet</p>
          <p className="text-sm text-gray-400">Send a message to start the conversation with {otherPartyName}</p>
        </div>
      )}

      {messages.length === 0 && isLoading && (
        <div className="space-y-4 animate-pulse" aria-hidden="true">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className={`h-10 rounded-2xl bg-gray-200 ${i % 2 === 0 ? 'w-40' : 'w-56'}`} />
            </div>
          ))}
        </div>
      )}

      <div ref={bottomRef} />

      {reportingMessage && (
        <ReportDialog
          reportedUserId={reportingMessage.sender_id}
          messageId={reportingMessage.id}
          conversationId={conversationId}
          onClose={() => setReportingMessage(null)}
        />
      )}
    </div>
  )
}

export default ChatThread
