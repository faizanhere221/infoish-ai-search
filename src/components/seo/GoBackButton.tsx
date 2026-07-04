'use client'

import { ArrowLeft } from 'lucide-react'

export function GoBackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Go back to previous page
    </button>
  )
}
