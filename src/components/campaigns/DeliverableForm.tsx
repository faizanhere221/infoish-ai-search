'use client'

import { Trash2 } from 'lucide-react'
import { PLATFORMS, DELIVERABLE_TYPES } from '@/types/campaigns'
import type { DeliverableInput } from './CampaignWizard'

interface DeliverableFormProps {
  deliverable: DeliverableInput
  index: number
  onChange: (id: string, field: keyof DeliverableInput, value: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
  error?: string
}

export default function DeliverableForm({
  deliverable,
  index,
  onChange,
  onRemove,
  canRemove,
  error,
}: DeliverableFormProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">Deliverable {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(deliverable.id)}
            className="text-gray-400 hover:text-red-500 p-1 -m-1"
            aria-label="Remove deliverable"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Platform *</label>
          <select
            value={deliverable.platform}
            onChange={(e) => onChange(deliverable.id, 'platform', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select platform</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
          <select
            value={deliverable.deliverable_type}
            onChange={(e) => onChange(deliverable.id, 'deliverable_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select type</option>
            {DELIVERABLE_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            max={100}
            value={deliverable.quantity}
            onChange={(e) => onChange(deliverable.id, 'quantity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={deliverable.description}
          onChange={(e) => onChange(deliverable.id, 'description', e.target.value)}
          placeholder="e.g. 10-minute dedicated review video covering key features"
          rows={2}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
