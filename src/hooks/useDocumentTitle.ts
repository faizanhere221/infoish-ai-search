'use client'

import { useEffect } from 'react'

// For client-component pages that can't export `metadata` (e.g. everything
// under src/app/admin/, since admin/layout.tsx is 'use client'). Sets the
// browser tab title directly; restores the previous title on unmount.
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} | Admin`
    return () => {
      document.title = previous
    }
  }, [title])
}
