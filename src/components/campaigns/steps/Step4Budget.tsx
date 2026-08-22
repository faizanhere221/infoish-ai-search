'use client'

import type { CampaignFormData, WizardErrors } from '../CampaignWizard'

interface Step4BudgetProps {
  data: CampaignFormData
  errors: WizardErrors
  onChange: <K extends keyof CampaignFormData>(field: K, value: CampaignFormData[K]) => void
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

const BUDGET_TYPES: { value: CampaignFormData['budget_type']; label: string; description: string }[] = [
  { value: 'fixed', label: 'Fixed', description: 'One set budget for the campaign' },
  { value: 'range', label: 'Range', description: 'A min and max budget' },
  { value: 'negotiable', label: 'Negotiable', description: "Discuss budget with each creator" },
]

const todayStr = () => new Date().toISOString().split('T')[0]

export default function Step4Budget({ data, errors, onChange }: Step4BudgetProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Budget Type *</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BUDGET_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('budget_type', option.value)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                data.budget_type === option.value
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  data.budget_type === option.value ? 'text-violet-700' : 'text-gray-900'
                }`}
              >
                {option.label}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {data.budget_type === 'fixed' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount *</label>
          <input
            type="number"
            min={0}
            value={data.budget_fixed}
            onChange={(e) => onChange('budget_fixed', e.target.value)}
            placeholder="e.g. 1000"
            className={`w-full sm:w-64 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.budget ? 'border-red-300' : 'border-gray-200'
            }`}
          />
          {errors.budget && <p className="mt-1.5 text-sm text-red-600">{errors.budget}</p>}
        </div>
      )}

      {data.budget_type === 'range' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Budget *</label>
            <input
              type="number"
              min={0}
              value={data.budget_min}
              onChange={(e) => onChange('budget_min', e.target.value)}
              placeholder="e.g. 500"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                errors.budget ? 'border-red-300' : 'border-gray-200'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Budget *</label>
            <input
              type="number"
              min={0}
              value={data.budget_max}
              onChange={(e) => onChange('budget_max', e.target.value)}
              placeholder="e.g. 2000"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                errors.budget ? 'border-red-300' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.budget && <p className="sm:col-span-2 text-sm text-red-600">{errors.budget}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
        <select
          value={data.currency}
          onChange={(e) => onChange('currency', e.target.value)}
          className="w-full sm:w-40 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline *</label>
          <input
            type="date"
            value={data.application_deadline}
            min={todayStr()}
            onChange={(e) => onChange('application_deadline', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.application_deadline ? 'border-red-300' : 'border-gray-200'
            }`}
          />
          {errors.application_deadline && (
            <p className="mt-1.5 text-sm text-red-600">{errors.application_deadline}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Start Date</label>
          <input
            type="date"
            value={data.campaign_start_date}
            min={todayStr()}
            onChange={(e) => onChange('campaign_start_date', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign End Date</label>
          <input
            type="date"
            value={data.campaign_end_date}
            min={data.campaign_start_date || todayStr()}
            onChange={(e) => onChange('campaign_end_date', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.campaign_end_date ? 'border-red-300' : 'border-gray-200'
            }`}
          />
          {errors.campaign_end_date && (
            <p className="mt-1.5 text-sm text-red-600">{errors.campaign_end_date}</p>
          )}
        </div>
      </div>
    </div>
  )
}
