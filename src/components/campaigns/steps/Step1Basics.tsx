'use client'

import { CAMPAIGN_OBJECTIVES, CAMPAIGN_CATEGORIES } from '@/types/campaigns'
import type { CampaignFormData, WizardErrors } from '../CampaignWizard'

interface Step1BasicsProps {
  data: CampaignFormData
  errors: WizardErrors
  onChange: <K extends keyof CampaignFormData>(field: K, value: CampaignFormData[K]) => void
}

export default function Step1Basics({ data, errors, onChange }: Step1BasicsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Title *</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g. Product review series for our new dev tool"
          maxLength={255}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
            errors.title ? 'border-red-300' : 'border-gray-200'
          }`}
        />
        {errors.title && <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe your campaign goals, what you're looking for in a creator, and any brand guidelines"
          rows={5}
          maxLength={5000}
          className={`w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${
            errors.description ? 'border-red-300' : 'border-gray-200'
          }`}
        />
        {errors.description && <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Objective *</label>
          <select
            value={data.objective}
            onChange={(e) => onChange('objective', e.target.value as CampaignFormData['objective'])}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.objective ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            <option value="">Select objective</option>
            {CAMPAIGN_OBJECTIVES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.objective && <p className="mt-1.5 text-sm text-red-600">{errors.objective}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select
            value={data.category}
            onChange={(e) => onChange('category', e.target.value as CampaignFormData['category'])}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.category ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            <option value="">Select category</option>
            {CAMPAIGN_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>}
        </div>
      </div>
    </div>
  )
}
