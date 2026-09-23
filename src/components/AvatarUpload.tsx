'use client'

import { useCallback, useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  currentUrl?: string | null
  fallbackLetter?: string
  /** If provided, the file is uploaded here immediately on selection (matches the existing settings-page flow). Omit to defer the upload — the raw File is handed to onFileSelected instead, for flows like signup where no creator id exists yet. */
  uploadUrl?: string
  size?: number
  onUploaded?: (url: string) => void
  onFileSelected?: (file: File) => void
  onError?: (message: string) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

/** Downscales an image client-side (no interactive crop UI, just a sane max dimension) so uploads stay small and consistent. */
function resizeImage(file: File, maxDim = 512): Promise<File> {
  return new Promise((resolve) => {
    if (file.type === 'image/gif') {
      // Canvas resizing would flatten animated GIFs to a single frame — skip.
      resolve(file)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      if (scale >= 1) {
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          resolve(new File([blob], file.name, { type: file.type }))
        },
        file.type,
        0.9
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }
    img.src = objectUrl
  })
}

export default function AvatarUpload({
  currentUrl,
  fallbackLetter = 'U',
  uploadUrl,
  size = 96,
  onUploaded,
  onFileSelected,
  onError,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      if (!ALLOWED_TYPES.includes(file.type)) {
        const msg = 'File must be a JPG, PNG, GIF, or WEBP image'
        setError(msg)
        onError?.(msg)
        return
      }
      if (file.size > MAX_SIZE) {
        const msg = 'File must be 2MB or smaller'
        setError(msg)
        onError?.(msg)
        return
      }

      const processedFile = await resizeImage(file)
      setPreviewUrl(URL.createObjectURL(processedFile))

      if (!uploadUrl) {
        onFileSelected?.(processedFile)
        return
      }

      setUploading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const formData = new FormData()
        formData.append('file', processedFile)

        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        })
        const data = await res.json()

        if (!res.ok) {
          const msg = data.error || 'Failed to upload image'
          setError(msg)
          onError?.(msg)
          return
        }

        onUploaded?.(data.profile_photo_url)
      } catch (err) {
        console.error('Avatar upload error:', err)
        const msg = 'Network error. Please try again.'
        setError(msg)
        onError?.(msg)
      } finally {
        setUploading(false)
      }
    },
    [uploadUrl, onUploaded, onFileSelected, onError]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) {handleFile(file)}
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {handleFile(file)}
  }

  const displayUrl = previewUrl || currentUrl

  return (
    <div className="flex items-center gap-6">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') {fileInputRef.current?.click()} }}
        className={`relative flex-shrink-0 rounded-full cursor-pointer group ${isDragging ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`}
        style={{ width: size, height: size }}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold"
            style={{ fontSize: size * 0.35 }}
          >
            {fallbackLetter}
          </div>
        )}

        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : displayUrl ? 'Change Photo' : 'Upload Photo'}
        </button>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF or WEBP. Max 2MB. Click or drag &amp; drop.</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  )
}
