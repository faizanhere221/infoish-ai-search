'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, Image, X, Loader2, AlertTriangle } from 'lucide-react'

interface Attachment {
  id: string
  type: 'image' | 'file'
  name: string
  size: number
  url?: string
  file?: File
}

interface MessageInputProps {
  onSend: (content: string, attachments?: Attachment[]) => Promise<{ success: boolean; warning?: string }>
  placeholder?: string
  disabled?: boolean
  maxLength?: number
}

export function MessageInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 2000,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSending, setIsSending] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending || disabled) return

    setIsSending(true)
    setWarning(null)

    try {
      const result = await onSend(message.trim(), attachments)
      
      if (result.success) {
        setMessage('')
        setAttachments([])
        if (result.warning) {
          setWarning(result.warning)
          // Auto-dismiss warning after 5 seconds
          setTimeout(() => setWarning(null), 5000)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const newAttachments: Attachment[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      name: file.name,
      size: file.size,
      file,
    }))

    setAttachments(prev => [...prev, ...newAttachments])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Reset height to auto to get the correct scrollHeight
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white p-4">
      {/* Warning Banner */}
      {warning && (
        <div className="mb-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">{warning}</p>
          </div>
          <button 
            onClick={() => setWarning(null)}
            className="text-amber-500 hover:text-amber-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <div 
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
            >
              {attachment.type === 'image' ? (
                <Image className="w-4 h-4 text-gray-500" />
              ) : (
                <Paperclip className="w-4 h-4 text-gray-500" />
              )}
              <div className="max-w-[150px]">
                <p className="text-sm text-gray-900 truncate">{attachment.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
              </div>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            maxLength={maxLength}
            rows={1}
            className="w-full px-4 py-2.5 bg-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />
          
          {/* Character Count */}
          {message.length > maxLength * 0.8 && (
            <span className={`absolute bottom-1 right-2 text-xs ${
              message.length >= maxLength ? 'text-red-500' : 'text-gray-400'
            }`}>
              {message.length}/{maxLength}
            </span>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
          className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Platform Warning */}
      <p className="text-xs text-gray-400 mt-2 text-center">
        Keep all transactions on Infoishai for secure payments and support
      </p>
    </div>
  )
}

export default MessageInput