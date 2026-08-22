'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { PLATFORMS } from '@/types/campaigns'
import type { CampaignFormData, WizardErrors } from '../CampaignWizard'

interface Step2RequirementsProps {
  data: CampaignFormData
  errors: WizardErrors
  onChange: <K extends keyof CampaignFormData>(field: K, value: CampaignFormData[K]) => void
}

export default function Step2Requirements({ data, errors, onChange }: Step2RequirementsProps) {
  const [countryInput, setCountryInput] = useState('')

  function togglePlatform(platform: CampaignFormData['platforms'][number]) {
    const isSelected = data.platforms.includes(platform)
    onChange(
      'platforms',
      isSelected ? data.platforms.filter((p) => p !== platform) : [...data.platforms, platform]
    )
  }

  function addCountry() {
    const value = countryInput.trim()
    if (!value || data.target_countries.includes(value)) {
      setCountryInput('')
      return
    }
    onChange('target_countries', [...data.target_countries, value])
    setCountryInput('')
  }

  function removeCountry(country: string) {
    onChange('target_countries', data.target_countries.filter((c) => c !== country))
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Platforms Needed *</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const selected = data.platforms.includes(p.value)
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePlatform(p.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selected
                    ? 'bg-violet-50 border-violet-300 text-violet-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        {errors.platforms && <p className="mt-1.5 text-sm text-red-600">{errors.platforms}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Followers</label>
        <input
          type="number"
          min={0}
          value={data.min_followers}
          onChange={(e) => onChange('min_followers', e.target.value)}
          placeholder="e.g. 5000"
          className="w-full sm:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <p className="mt-1.5 text-xs text-gray-400">Leave blank if there's no minimum</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target Countries</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={countryInput}
            onChange={(e) => setCountryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addCountry()
              }
            }}
            placeholder="e.g. United States"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="button"
            onClick={addCountry}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Add
          </button>
        </div>
        {data.target_countries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.target_countries.map((country) => (
              <span
                key={country}
                className="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-sm"
              >
                {country}
                <button type="button" onClick={() => removeCountry(country)} className="hover:text-violet-900">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-xs text-gray-400">Leave blank to target creators from any country</p>
      </div>
    </div>
  )
}
