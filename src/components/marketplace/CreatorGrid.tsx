'use client'

import { useState } from 'react'
import { LayoutGrid, List, Loader2 } from 'lucide-react'
import { CreatorCard } from '@/components/creator/CreatorCard'
import type { CreatorProfile } from '@/types/marketplace'

interface CreatorGridProps {
  creators: CreatorProfile[]
  isLoading?: boolean
  onSaveCreator?: (creatorId: string) => void
  onUnsaveCreator?: (creatorId: string) => void
  savedCreatorIds?: Set<string>
  showViewToggle?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
}

export function CreatorGrid({
  creators,
  isLoading = false,
  onSaveCreator,
  onUnsaveCreator,
  savedCreatorIds = new Set(),
  showViewToggle = true,
  emptyMessage = 'No creators found',
  emptyIcon,
}: CreatorGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {emptyIcon || (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LayoutGrid className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div>
      {/* View Toggle */}
      {showViewToggle && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {creators.length} creator{creators.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {creators.map(creator => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              variant="grid"
              onSave={onSaveCreator}
              onUnsave={onUnsaveCreator}
              isSaved={savedCreatorIds.has(creator.id)}
              showSaveButton={!!onSaveCreator}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {creators.map(creator => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              variant="list"
              onSave={onSaveCreator}
              onUnsave={onUnsaveCreator}
              isSaved={savedCreatorIds.has(creator.id)}
              showSaveButton={!!onSaveCreator}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CreatorGrid