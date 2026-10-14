'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { Send, Loader2, Paperclip, X, FileText, AlertTriangle } from 'lucide-react'
import type { Attachment } from '@/types/marketplace'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (attachments: Attachment[]) => void
  onUploadFile?: (file: File, onProgress: (pct: number) => void) => Promise<Attachment>
  placeholder?: string
  disabled?: boolean
  sending?: boolean
  maxLength?: number
}

const DEFAULT_MAX_LENGTH = 5000
const WARNING_THRESHOLD = 0.9
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB — mirrors the server-side limit for fast feedback
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4',
  'application/zip',
  'application/x-zip-compressed',
])

interface PendingAttachment {
  tempId: string
  name: string
  size: number
  status: 'uploading' | 'uploaded' | 'failed'
  progress: number
  attachment?: Attachment
  error?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes} B`}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`}
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onUploadFile,
  placeholder = 'Type a message…',
  disabled = false,
  sending = false,
  maxLength = DEFAULT_MAX_LENGTH,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingAttachment[]>([])

  const uploadedAttachments = pending
    .map(p => p.attachment)
    .filter((a): a is Attachment => a !== undefined)
  const isUploading = pending.some(p => p.status === 'uploading')
  const canSend = (value.trim().length > 0 || uploadedAttachments.length > 0) && !disabled && !sending && !isUploading

  const handleSend = () => {
    if (!canSend) {return}
    onSend(uploadedAttachments)
    setPending([])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (fileInputRef.current) {fileInputRef.current.value = ''}
    if (!onUploadFile) {return}

    for (const file of files) {
      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      if (!ALLOWED_TYPES.has(file.type)) {
        setPending(prev => [...prev, {
          tempId, name: file.name, size: file.size, status: 'failed', progress: 0,
          error: 'Unsupported file type',
        }])
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setPending(prev => [...prev, {
          tempId, name: file.name, size: file.size, status: 'failed', progress: 0,
          error: 'File is larger than 10MB',
        }])
        continue
      }

      setPending(prev => [...prev, { tempId, name: file.name, size: file.size, status: 'uploading', progress: 0 }])

      onUploadFile(file, (pct) => {
        setPending(prev => prev.map(p => (p.tempId === tempId ? { ...p, progress: pct } : p)))
      })
        .then((attachment) => {
          setPending(prev => prev.map(p => (p.tempId === tempId ? { ...p, status: 'uploaded', attachment } : p)))
        })
        .catch(() => {
          setPending(prev => prev.map(p => (p.tempId === tempId ? { ...p, status: 'failed', error: 'Upload failed' } : p)))
        })
    }
  }

  const removePending = (tempId: string) => {
    setPending(prev => prev.filter(p => p.tempId !== tempId))
  }

  const nearLimit = value.length > maxLength * WARNING_THRESHOLD

  return (
    <div className="border-t border-gray-100 bg-white p-4">
      {pending.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {pending.map(p => (
            <div key={p.tempId} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg max-w-[220px]">
              {p.status === 'failed' ? (
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />
              ) : (
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{p.name}</p>
                {p.status === 'uploading' ? (
                  <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-pink to-brand-purple transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                ) : p.status === 'failed' ? (
                  <p className="text-xs text-red-500">{p.error}</p>
                ) : (
                  <p className="text-xs text-gray-500">{formatFileSize(p.size)}</p>
                )}
              </div>
              <button
                onClick={() => removePending(p.tempId)}
                className="p-1 hover:bg-gray-200 rounded flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                aria-label={`Remove ${p.name}`}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        {onUploadFile && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || sending}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink flex-shrink-0"
              aria-label="Attach a file"
              title="Attach a file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.zip"
            />
          </>
        )}

        <div className="flex-1 relative">
          <label htmlFor="message-composer" className="sr-only">
            Message
          </label>
          <textarea
            id="message-composer"
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            maxLength={maxLength}
            rows={1}
            className="w-full px-4 py-2.5 bg-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-pink focus:bg-white disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />

          {nearLimit && (
            <span
              className={`absolute bottom-1 right-2 text-xs ${value.length >= maxLength ? 'text-red-500' : 'text-gray-400'}`}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-pink"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Press Enter to send. Use Shift+Enter for a new line.
      </p>
    </div>
  )
}

export default MessageInput
