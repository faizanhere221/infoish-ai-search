'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ExternalLink, Play, Image as ImageIcon, FileText } from 'lucide-react'
import type { PortfolioItem } from '@/types/marketplace'

interface PortfolioGridProps {
  items: PortfolioItem[]
  maxDisplay?: number
  showAll?: boolean
}

export function PortfolioGrid({
  items,
  maxDisplay = 6,
  showAll = false,
}: PortfolioGridProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [showAllItems, setShowAllItems] = useState(showAll)

  const displayedItems = showAllItems ? items : items.slice(0, maxDisplay)
  const hasMore = items.length > maxDisplay && !showAllItems

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No portfolio items yet
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-6 h-6" />
      case 'image':
        return <ImageIcon className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="group relative aspect-video bg-gray-100 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
          >
            {/* Thumbnail */}
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title || 'Portfolio item'}
                fill
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                {getTypeIcon(item.type)}
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {item.type === 'video' && (
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm font-medium truncate">
                {item.title || 'Untitled'}
              </p>
            </div>

            {/* Type Badge */}
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full capitalize">
                {item.type}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAllItems(true)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Show all {items.length} items
          </button>
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setSelectedItem(null)}
          />
          <div className="fixed inset-4 md:inset-10 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 truncate">
                  {selectedItem.title || 'Untitled'}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedItem.url && (
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ExternalLink className="w-5 h-5 text-gray-500" />
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {selectedItem.type === 'video' && selectedItem.url && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {selectedItem.url.includes('youtube') || selectedItem.url.includes('youtu.be') ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(selectedItem.url)}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={selectedItem.url}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>
                )}

                {selectedItem.type === 'image' && selectedItem.url && (
                  <Image
                    src={selectedItem.url}
                    alt={selectedItem.title || 'Portfolio item'}
                    width={800}
                    height={600}
                    className="max-w-full max-h-[60vh] mx-auto rounded-lg object-contain"
                  />
                )}

                {selectedItem.description && (
                  <p className="mt-4 text-gray-600">
                    {selectedItem.description}
                  </p>
                )}

                {/* Metrics */}
                {selectedItem.metrics && Object.keys(selectedItem.metrics).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {Object.entries(selectedItem.metrics).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg px-4 py-2">
                        <p className="text-xs text-gray-500 capitalize">{key}</p>
                        <p className="font-semibold text-gray-900">
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Helper to extract YouTube video ID
function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : ''
}

export default PortfolioGrid