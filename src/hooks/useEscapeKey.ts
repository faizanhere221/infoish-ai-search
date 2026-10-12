'use client'

import { useEffect } from 'react'

// Closes a modal/dialog when Escape is pressed. Pass the close handler and
// whether the dialog is currently open (so the listener is only attached
// while it matters).
export function useEscapeKey(onClose: () => void, isOpen = true) {
  useEffect(() => {
    if (!isOpen) {return}
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose()}
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, isOpen])
}
