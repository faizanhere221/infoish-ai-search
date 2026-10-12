'use client'

import { useEffect } from 'react'
import { captureError } from '@/lib/error-tracking'

// Catches errors thrown by the root layout itself. This replaces the entire
// document, so it renders its own <html>/<body> and avoids depending on
// Tailwind/app CSS having loaded successfully.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest, scope: 'root-layout' })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '1rem',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
            Infoishai hit an unexpected error. Please reload the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(to right, #de5688, #b153c8)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
