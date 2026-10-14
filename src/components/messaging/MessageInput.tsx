'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  sending?: boolean
  maxLength?: number
}

const DEFAULT_MAX_LENGTH = 5000
const WARNING_THRESHOLD = 0.9

export function MessageInput({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message…',
  disabled = false,
  sending = false,
  maxLength = DEFAULT_MAX_LENGTH,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!value.trim() || disabled || sending) {return}
    onSend()
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

  const nearLimit = value.length > maxLength * WARNING_THRESHOLD

  return (
    <div className="border-t border-gray-100 bg-white p-4">
      <div className="flex items-end gap-3">
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
          disabled={disabled || sending || !value.trim()}
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
